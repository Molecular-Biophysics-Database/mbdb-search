import yaml
import json

def resolve_ref(ref, defs):
    ref_key = ref.split('/')[-1]
    return defs.get(ref_key, {})

def build_json_output(schema, base_path, defs, json_output):
    if 'properties' in schema:
        for key, value in schema['properties'].items():
            new_base_path = f"metadata.{key}" if not base_path else f"{base_path}.{key}"
            if 'use' in value:
                ref_data = resolve_ref(value['use'], defs)
                if 'properties' in ref_data:
                    build_json_output(ref_data, new_base_path, defs, json_output)
            elif 'type' in value:
                field_type = 'string' if value['type'] == 'keyword' else value['type']
                field_description = value.get('help.en', '')
                json_output.append({
                    "pretty_name": key,
                    "field_path": new_base_path,
                    "type": field_type,
                    "description": field_description
                })
            else:
                build_json_output(value, base_path, defs, json_output)

with open('simplified_model.yaml', 'r') as file:
    yaml_content = file.read()

yaml_data = yaml.safe_load(yaml_content)
json_output = []
build_json_output(yaml_data['record'], '', yaml_data.get('$defs', {}), json_output)
json_output_string = json.dumps(json_output, indent=2)
print(json_output_string)

with open('output.json', 'w') as json_file:
    json_file.write(json_output_string)
