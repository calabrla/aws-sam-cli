import layer_version_dependency
import python_layer_version_dependency
import json

def lambda_handler(event, context):
  depend1 = layer_version_dependency.get_dependency()
  depend2 = python_layer_version_dependency.get_dependency()

  response = {
    "statusCode": 200,
    "body": json.dumps({
     "message": f"Hello World from python pre built function {depend1+depend2}",
    }),
  }
  return response