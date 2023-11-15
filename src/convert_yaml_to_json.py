import yaml
import json


def resolve_ref(ref, defs):
    ref_key = ref.split('/')[-1]
    return defs.get(ref_key, {})


# Example -> will take the ref in format #/$defs/ReferenceName and split it by / and take the last part
# General_parameters


def build_json_output(schema, base_path, defs, json_output):
    if 'properties' in schema:
        for key, value in schema['properties'].items():
            # If at the root level, prepend 'metadata' to the path, otherwise append the key
            # TODO I had a problem with appending root (metadata) because it appended it twice
            new_base_path = f"metadata.{key}" if not base_path else f"{base_path}.{key}"

            if 'use' in value:
                # Resolve the 'use' reference
                ref_data = resolve_ref(value['use'], defs)
                if 'properties' in ref_data:
                    # Continue with the new base path for the resolved properties
                    build_json_output(ref_data, new_base_path, defs, json_output)
            elif 'type' in value:
                # We have a field definition; add it to the output
                field_type = 'string' if value['type'] == 'keyword' else value['type']
                field_description = value.get('help.en', '')
                field_item = {
                    "pretty_name": key,
                    "field_path": new_base_path,
                    "type": field_type,
                    "description": field_description
                }
                # Check for 'minimum' and 'maximum' and add them if present
                if 'minimum' in value:
                    field_item['minimum'] = value['minimum']
                if 'maximum' in value:
                    field_item['maximum'] = value['maximum']

                json_output.append(field_item)
            else:
                # If there is no 'use' or 'type', it might be a nested object without its own type
                # Continue without appending to the path
                build_json_output(value, base_path, defs, json_output)


# Read YAML content from a file
with open('simplified_model.yaml', 'r') as file:
    yaml_content = file.read()

yaml_data = yaml.safe_load(yaml_content)

# Initialize the JSON output list
json_output = []

# Start building the JSON output from the top-level 'properties'
# yaml_data.get('$defs', {}) will return the value associated with the '$defs'
# $defs is used as a section
build_json_output(yaml_data['record'], '', yaml_data.get('$defs', {}), json_output)

# Convert the JSON output list to a JSON string
json_output_string = json.dumps(json_output, indent=2)

# Print out the resulting JSON structure
print(json_output_string)

# Save the JSON output to a file
with open('output.json', 'w') as json_file:
    json_file.write(json_output_string)
