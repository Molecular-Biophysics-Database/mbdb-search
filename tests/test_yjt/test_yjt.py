import pytest
import json
import os
from src.data.convert_yaml_to_json import (
    read_from_file,
    write_to_file,
    resolve_ref,
    create_field_item,
    build_json_output,
)

# /////////////////////
# ///  go to ./src  ///
# ///  run pytest   ///
# /////////////////////

# Constants for testing
path_to_current_file = os.path.realpath(__file__)
current_directory = os.path.dirname(path_to_current_file)
SAMPLE_YAML_FILE = os.path.join(current_directory, "simplified_model.yaml")
SAMPLE_OUTPUT_FILE = "temp_test.json"


# Test for read_from_file function
def test_read_from_file():
    data = read_from_file(SAMPLE_YAML_FILE)
    assert "record" in data
    assert "properties" in data["record"]


# Test for write_to_file function
def test_write_to_file():
    test_data = {"test": "data"}
    write_to_file(SAMPLE_OUTPUT_FILE, json.dumps(test_data))
    with open(SAMPLE_OUTPUT_FILE, "r") as file:
        data = json.load(file)
    assert data == test_data
    os.remove(SAMPLE_OUTPUT_FILE)


# Test for resolve_ref function
def test_resolve_ref():
    yaml_data = read_from_file(SAMPLE_YAML_FILE)
    defs = yaml_data.get("$defs", {})
    ref = "#/$defs/General_parameters"
    result = resolve_ref(ref, defs)
    assert "properties" in result


# Test for create_field_item function
def test_create_field_item():
    key = "example"
    value = {
        "type": "keyword",
        "help.en": "Example description",
        "minimum": 1,
        "maximum": 10,
    }
    current_path = "path.to.example"
    result = create_field_item(key, value, current_path)
    expected_result = {
        "pretty_name": key,
        "field_path": current_path,
        "type": "string",
        "description": value.get("help.en", ""),
        "minimum": 1,
        "maximum": 10,
    }
    assert result == expected_result  # Check if the result matches the expected output


def test_nested_properties():
    yaml_data = read_from_file(SAMPLE_YAML_FILE)
    json_output = []
    build_json_output(yaml_data["record"], "", yaml_data.get("$defs", {}), json_output)
    assert any(
        item["field_path"] == "metadata.general_parameters.record_information.title"
        for item in json_output
    )
