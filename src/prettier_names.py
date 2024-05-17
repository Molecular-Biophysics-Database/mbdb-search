import json
from typing import List, Dict


# Read from a file
def read_from_file(file_name):
    with open(file_name, 'r') as file:
        return json.load(file)


# Write to a file
def write_to_file(file_name, data):
    with open(file_name, 'w') as file:
        json.dump(data, file, indent=2)


def format_name(name):
    if isinstance(name, list):
        name = ", ".join(name)
    return name.replace('_', ' ').capitalize()


def update_pretty_name(item, pretty_names_to_update):
    # Create a dictionary to store pretty names and their counts
    pretty_name = item["pretty_name"]
    field_path = item["field_path"]

    # Check if the pretty_name is in the set of names to update
    new_pretty_name = format_name(pretty_name)
    if pretty_name in pretty_names_to_update:
        unique_name = pretty_names_to_update[pretty_name][field_path]
        parent_name = unique_name.split('.')[:-1]
        new_pretty_name = f"{format_name(parent_name[-1])}, {new_pretty_name}"
        if len(parent_name) > 1:
            new_pretty_name = f"{new_pretty_name} ({format_name(parent_name[:-1])})"

    item["pretty_name"] = new_pretty_name


def find_duplicate_names(data) -> Dict[str, List[str]]:
    duplicate_names = {}

    # Scan through the data to identify duplicate pretty names
    for item in data:
        pretty_name = item["pretty_name"]

        # Check if the pretty_name has already been seen
        if pretty_name not in duplicate_names:
            duplicate_names[pretty_name] = []

        duplicate_names[pretty_name] += [item["field_path"]]

    return {k: v for k, v in duplicate_names.items() if len(v) > 1}


def remove_if_equal(field_paths):
    split_paths = [field_path.split('.') for field_path in field_paths]
    while True:
        try:
            unique_elements = {path[0] for path in split_paths}
        except IndexError:
            raise ValueError("duplicate field paths found, they should be unique")

        if len(unique_elements) != 1:
            break

        for path in split_paths:
            path.pop(0)

    return {field_path: ".".join(split_path) for field_path, split_path in zip(field_paths, split_paths)}


def make_minimal_duplicate_names(duplicate_names):
    return {pretty_name: remove_if_equal(field_paths) for pretty_name, field_paths in duplicate_names.items()}


def update_duplicate_pretty_names_new(data):

    duplicate_names = find_duplicate_names(data)
    pretty_names_to_update = make_minimal_duplicate_names(duplicate_names)

    # Iterate through the data to update the pretty names
    for item in data:
        update_pretty_name(item, pretty_names_to_update)

def update_duplicate_pretty_names(data):
    seen_pretty_names = set()
    pretty_names_to_update = set()

    # Scan through the data to identify duplicate pretty names
    for item in data:
        pretty_name = item["pretty_name"]

        # Check if the pretty_name has already been seen
        if pretty_name in seen_pretty_names:
            pretty_names_to_update.add(pretty_name)

        seen_pretty_names.add(pretty_name)

    # Iterate through the data again to update the pretty names
    for item in data:
        update_pretty_name(item, pretty_names_to_update)


def main():
    input_file = "output.json"

    # Read the JSON data from the input file
    data = read_from_file(input_file)

    # Update duplicate pretty names
    update_duplicate_pretty_names_new(data)

    # Write the updated data back to the file
    write_to_file(input_file, data)


if __name__ == "__main__":
    main()
