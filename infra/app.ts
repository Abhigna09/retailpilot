import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import { RetailPilotStack } from "./retailPilotStack";

const app = new cdk.App();
new RetailPilotStack(app, "RetailPilotStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ap-south-1",
  },
});