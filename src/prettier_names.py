import json


# Read from a file
def read_from_file(file_name):
    with open(file_name, 'r') as file:
        return json.load(file)


# Write to a file
def write_to_file(file_name, data):
    with open(file_name, 'w') as file:
        json.dump(data, file, indent=2)


def format_name(name):
    return name.replace('_', ' ').capitalize()


def update_pretty_name(item, pretty_names_to_update):
    # Create a dictionary to store pretty names and their counts
    pretty_name = item["pretty_name"]
    field_path = item["field_path"]

    # Check if the pretty_name is in the set of names to update
    new_pretty_name = format_name(pretty_name)
    if pretty_name in pretty_names_to_update:
        parent_name = field_path.split('.')[-2]
        new_pretty_name = f"{new_pretty_name} ({format_name(parent_name)})"

    item["pretty_name"] = new_pretty_name


def update_duplicate_pretty_names(data):
    pretty_name_counts = {}
    pretty_names_to_update = set()

    # Scan through the data to identify duplicate pretty names
    for item in data:
        pretty_name = item["pretty_name"]

        # Check if the pretty_name is already in the counts dictionary
        if pretty_name in pretty_name_counts:
            pretty_names_to_update.add(pretty_name)
        else:
            pretty_name_counts[pretty_name] = 1

    # Iterate through the data again to update the pretty names
    for item in data:
        update_pretty_name(item, pretty_names_to_update)


def main():
    input_file = "output.json"

    # Read the JSON data from the input file
    data = read_from_file(input_file)

    # Update duplicate pretty names
    update_duplicate_pretty_names(data)

    # Write the updated data back to the file
    write_to_file(input_file, data)


if __name__ == "__main__":
    main()
