import yaml
import json


# Read from a file
def read_from_file(file_name):
    with open(file_name, 'r') as file:
        yaml_content = file.read()
        yaml_data = yaml.safe_load(yaml_content)
    return yaml_data


# Write to a file
def write_to_file(file_name, data):
    with open(file_name, 'w') as file:
        file.write(data)


def resolve_ref(ref, defs):
    ref_key = ref.split('/')[-1]
    return defs.get(ref_key, {})


# Create and return a field item dictionary.
def create_field_item(key, value, current_path, polytype=None):
    field_item = {
        "pretty_name": key,
        "field_path": current_path,
        "type": 'string' if value['type'] == 'keyword' else value['type'],
        "description": value.get('help.en', '')
    }
    # Append 'minimum' and 'maximum' if they exist
    if 'minimum' in value:
        field_item['minimum'] = value['minimum']
    if 'maximum' in value:
        field_item['maximum'] = value['maximum']
    if polytype:
        # Only add 'poly_type' if it is not None
        field_item['poly_type'] = polytype.strip().strip(',')
    return field_item


# Example -> will take the ref in format #/$defs/ReferenceName and split it by / and take the last part
# General_parameters


def build_json_output(schema, base_path, defs, json_output, polytype=None):
    ignore_keys = ['value_error', 'unit', 'id', 'collected_default_search_fields']  # List of keys to ignore

    if 'type' in schema and schema['type'] == 'polymorphic':
        if 'schemas' in schema:
            for subtype, details in schema['schemas'].items():
                if details.get('required', False):  # Make sure the schema is required to proceed
                    new_polytype = f"{polytype}, {subtype}" if polytype else subtype
                    ref_data = resolve_ref(details['use'], defs)
                    # Continue using the existing base path, do not append subtype
                    build_json_output(ref_data, base_path, defs, json_output, new_polytype)
    else:
        if 'properties' in schema:
            for key, value in schema['properties'].items():
                # TODO: Currently ignoring 'value_error', 'unit', and 'id'. Revisit if needed.
                if key in ignore_keys:
                    continue  # Skip processing for ignored keys
                current_path = f"{base_path}.{key}" if base_path else key
                if 'use' in value:
                    ref_data = resolve_ref(value['use'], defs)
                    build_json_output(ref_data, current_path, defs, json_output, polytype)
                elif 'type' in value:
                    # We have a field definition; add it to the output
                    field_item = create_field_item(key, value, current_path,
                                                   polytype)  # Pass polytype to field item creation
                    json_output.append(field_item)
                else:
                    build_json_output(value, current_path, defs, json_output, polytype)


def main():
    # yaml_name = "simplified_model.yaml"
    yaml_name = "MST.yaml"
    json_name = "output.json"

    # Read YAML content from a file
    yaml_data = read_from_file(yaml_name)
    json_output = []

    # Start from the root 'record' property
    # yaml_data.get('$defs', {}) will return the value associated with the '$defs'
    # $defs is used as a section
    build_json_output(yaml_data['record'], '', yaml_data.get('$defs', {}), json_output)

    # Convert the JSON output list to a JSON string
    json_output_string = json.dumps(json_output, indent=2)

    # Print out the resulting JSON structure
    print(json_output_string)

    # Save the JSON output to a file
    write_to_file(json_name, json_output_string)


if __name__ == "__main__":
    main()
