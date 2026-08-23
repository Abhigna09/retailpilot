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

    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
  }
}