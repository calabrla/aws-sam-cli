import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { PythonFunction, PythonLayerVersion } from '@aws-cdk/aws-lambda-python';
import * as logs from '@aws-cdk/aws-logs';
import {AwsCliLayer} from "@aws-cdk/lambda-layer-awscli";
import {KubectlLayer} from "@aws-cdk/lambda-layer-kubectl";
import {NodeProxyAgentLayer} from "@aws-cdk/lambda-layer-node-proxy-agent";
import {CfnLayerVersion} from "@aws-cdk/aws-lambda";

export class NestedStack1 extends cdk.NestedStack {

    constructor(scope: cdk.Construct, id: string, props?: cdk.NestedStackProps) {
        super(scope, id, props);

        // Shared Layers
        // https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_lambda-layer-awscli.AwsCliLayer.html
        const awsCliLayer = new AwsCliLayer(this, 'AwsCliLayer');
        // https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_lambda-layer-kubectl.KubectlLayer.html
        const kubectlLayer = new KubectlLayer(this, 'KubectlLayer');
        const nodeProxyAgentLayer = new NodeProxyAgentLayer(this, 'NodeProxyAgentLayer');

        // Python Runtime
        // Layers
        // https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-lambda-python.PythonLayerVersion.html
        const pythonLayerVersion = new PythonLayerVersion(this, 'PythonLayerVersion', {
          compatibleRuntimes: [
            lambda.Runtime.PYTHON_3_7,
            lambda.Runtime.PYTHON_3_8,
            lambda.Runtime.PYTHON_3_9,
          ],
          entry: '../../src/python/layers/PythonLayerVersion',
        });
        // https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-lambda.LayerVersion.html
        const layerVersion = new lambda.LayerVersion(this, 'LayerVersion', {
          compatibleRuntimes: [
            lambda.Runtime.PYTHON_3_7,
            lambda.Runtime.PYTHON_3_8,
            lambda.Runtime.PYTHON_3_9,
          ],
          code: lambda.Code.fromAsset('../../src/python/layers/LayerVersion'),
        });
        // add SAM metadata to build layer
        const cfnLayerVersion = layerVersion.node.defaultChild as CfnLayerVersion;
        cfnLayerVersion.addMetadata('BuildMethod', 'python3.7');

        // ZIP package type Functions
        // Functions Built by CDK - Runtime Functions Constructs
        // https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-lambda-python.PythonFunction.html
        const nestedPythonFunction = new PythonFunction(this, 'NestedPythonFunction', {
          entry: '../../src/python/NestedPythonFunctionConstruct',
          index: 'app.py',
          handler: 'lambda_handler',
          runtime: lambda.Runtime.PYTHON_3_9,
          layers: [pythonLayerVersion, layerVersion, awsCliLayer, kubectlLayer, nodeProxyAgentLayer],
          tracing: lambda.Tracing.ACTIVE,
        });

        const httpApi = new HttpApi(this, 'httpAPi', {
        });

        httpApi.addRoutes({
            path: '/httpapis/nestedPythonFunction',
            methods: [HttpMethod.GET],
            integration: new HttpLambdaIntegration('httpApiRandomNameIntegration',
                nestedPythonFunction, {}
            ),
        });

    }
}