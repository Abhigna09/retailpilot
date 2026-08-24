import * as lambda_ from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

export class RetailPilotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Single DynamoDB table, single-table design (same pattern as PRAJNA)
    const table = new dynamodb.Table(this, "RetailPilotTable", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // fine for hackathon, not production
    });

    // shared env vars every Lambda needs
    const sharedEnv = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
      TABLE_NAME: table.tableName,
    };

    // Lambda 1: analyze product
    const analyzeFn = new lambda.NodejsFunction(this, "AnalyzeProductFn", {
      entry: path.join(__dirname, "../src/handlers/analyzeProduct.ts"),
      handler: "handler",
      environment: sharedEnv,
      timeout: cdk.Duration.seconds(30),
      runtime: lambda_.Runtime.NODEJS_20_X,
    });

    // Lambda 2: execute payment
    const paymentFn = new lambda.NodejsFunction(this, "ExecutePaymentFn", {
      entry: path.join(__dirname, "../src/handlers/executePayment.ts"),
      handler: "handler",
      environment: sharedEnv,
      timeout: cdk.Duration.seconds(30),
    });

    table.grantReadWriteData(analyzeFn);
    table.grantReadWriteData(paymentFn);

    // API Gateway, routes to both Lambdas
    const api = new apigateway.RestApi(this, "RetailPilotApi", {
      restApiName: "RetailPilot API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

       const analyze = api.root.addResource("analyze");
    analyze.addMethod("POST", new apigateway.LambdaIntegration(analyzeFn));

    const pay = api.root.addResource("pay");
    pay.addMethod("POST", new apigateway.LambdaIntegration(paymentFn));

    // Auth
    const signupFn = new lambda.NodejsFunction(this, "SignupFn", {
      entry: path.join(__dirname, "../src/handlers/auth.ts"),
      handler: "signupHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    const loginFn = new lambda.NodejsFunction(this, "LoginFn", {
      entry: path.join(__dirname, "../src/handlers/auth.ts"),
      handler: "loginHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    table.grantReadWriteData(signupFn);
    table.grantReadWriteData(loginFn);

    const auth = api.root.addResource("auth");
    const signupRes = auth.addResource("signup");
    signupRes.addMethod("POST", new apigateway.LambdaIntegration(signupFn));
    const loginRes = auth.addResource("login");
    loginRes.addMethod("POST", new apigateway.LambdaIntegration(loginFn));

    // Onboarding
    const addProductFn = new lambda.NodejsFunction(this, "AddProductFn", {
      entry: path.join(__dirname, "../src/handlers/onboarding.ts"),
      handler: "addProductHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    const addVendorFn = new lambda.NodejsFunction(this, "AddVendorFn", {
      entry: path.join(__dirname, "../src/handlers/onboarding.ts"),
      handler: "addVendorHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    const listProductsFn = new lambda.NodejsFunction(this, "ListProductsFn", {
      entry: path.join(__dirname, "../src/handlers/onboarding.ts"),
      handler: "listProductsHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    const listVendorsFn = new lambda.NodejsFunction(this, "ListVendorsFn", {
      entry: path.join(__dirname, "../src/handlers/onboarding.ts"),
      handler: "listVendorsHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    table.grantReadWriteData(addProductFn);
    table.grantReadWriteData(addVendorFn);
    table.grantReadWriteData(listProductsFn);
    table.grantReadWriteData(listVendorsFn);

    const productsRes = api.root.addResource("products");
    productsRes.addMethod("POST", new apigateway.LambdaIntegration(addProductFn));
    productsRes.addMethod("GET", new apigateway.LambdaIntegration(listProductsFn));

    const vendorsRes = api.root.addResource("vendors");
    vendorsRes.addMethod("POST", new apigateway.LambdaIntegration(addVendorFn));
    vendorsRes.addMethod("GET", new apigateway.LambdaIntegration(listVendorsFn));

    // Review (analysis + approval combined)
    const reviewFn = new lambda.NodejsFunction(this, "ReviewProductFn", {
      entry: path.join(__dirname, "../src/handlers/reviewProduct.ts"),
      handler: "handler",
      environment: sharedEnv,
      timeout: cdk.Duration.seconds(30),
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    table.grantReadWriteData(reviewFn);

    const reviewRes = api.root.addResource("review");
    reviewRes.addMethod("POST", new apigateway.LambdaIntegration(reviewFn));

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
}
}