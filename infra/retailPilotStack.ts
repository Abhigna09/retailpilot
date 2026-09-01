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
  runtime: lambda_.Runtime.NODEJS_20_X,
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

        // Sales & expiry tracking
    const recordSaleFn = new lambda.NodejsFunction(this, "RecordSaleFn", {
      entry: path.join(__dirname, "../src/handlers/tracking.ts"),
      handler: "recordSaleHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    const listSalesFn = new lambda.NodejsFunction(this, "ListSalesFn", {
      entry: path.join(__dirname, "../src/handlers/tracking.ts"),
      handler: "listSalesHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    const addExpiryFn = new lambda.NodejsFunction(this, "AddExpiryFn", {
      entry: path.join(__dirname, "../src/handlers/tracking.ts"),
      handler: "addExpiryHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    const listExpiryFn = new lambda.NodejsFunction(this, "ListExpiryFn", {
      entry: path.join(__dirname, "../src/handlers/tracking.ts"),
      handler: "listExpiryHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    table.grantReadWriteData(recordSaleFn);
    table.grantReadWriteData(listSalesFn);
    table.grantReadWriteData(addExpiryFn);
    table.grantReadWriteData(listExpiryFn);

    const salesRes = api.root.addResource("sales");
    salesRes.addMethod("POST", new apigateway.LambdaIntegration(recordSaleFn));
    salesRes.addMethod("GET", new apigateway.LambdaIntegration(listSalesFn));

    const expiryRes = api.root.addResource("expiry");
    expiryRes.addMethod("POST", new apigateway.LambdaIntegration(addExpiryFn));
    expiryRes.addMethod("GET", new apigateway.LambdaIntegration(listExpiryFn));

        // Lightweight status check — no AI, used by dashboard list
    const checkStatusFn = new lambda.NodejsFunction(this, "CheckStatusFn", {
      entry: path.join(__dirname, "../src/handlers/checkStatus.ts"),
      handler: "handler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    table.grantReadWriteData(checkStatusFn);

    const statusRes = api.root.addResource("status");
    statusRes.addMethod("GET", new apigateway.LambdaIntegration(checkStatusFn));

        // Real audit trail — lists all persisted AgentActions for a user
    const listActionsFn = new lambda.NodejsFunction(this, "ListActionsFn", {
      entry: path.join(__dirname, "../src/handlers/actions.ts"),
      handler: "handler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    table.grantReadWriteData(listActionsFn);

    const actionsRes = api.root.addResource("actions");
    actionsRes.addMethod("GET", new apigateway.LambdaIntegration(listActionsFn));

        // List-all endpoints for Sales History and Product Expiry pages
    const listAllSalesFn = new lambda.NodejsFunction(this, "ListAllSalesFn", {
      entry: path.join(__dirname, "../src/handlers/tracking.ts"),
      handler: "listAllSalesHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    const listAllExpiryFn = new lambda.NodejsFunction(this, "ListAllExpiryFn", {
      entry: path.join(__dirname, "../src/handlers/tracking.ts"),
      handler: "listAllExpiryHandler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });
    table.grantReadWriteData(listAllSalesFn);
    table.grantReadWriteData(listAllExpiryFn);

    const allSalesRes = salesRes.addResource("all");
    allSalesRes.addMethod("GET", new apigateway.LambdaIntegration(listAllSalesFn));

    const allExpiryRes = expiryRes.addResource("all");
    allExpiryRes.addMethod("GET", new apigateway.LambdaIntegration(listAllExpiryFn));

    // Preview safety checks — dry run, no state change
    const previewChecksFn = new lambda.NodejsFunction(this, "PreviewChecksFn", {
      entry: path.join(__dirname, "../src/handlers/previewChecks.ts"),
      handler: "handler",
      environment: sharedEnv,
      runtime: lambda_.Runtime.NODEJS_20_X,
    });

    const previewRes = api.root.addResource("preview-checks");
    previewRes.addMethod("POST", new apigateway.LambdaIntegration(previewChecksFn));

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
}
}