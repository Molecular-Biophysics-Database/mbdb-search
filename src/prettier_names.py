import json


def update_duplicate_pretty_names(input_file):
    # Read the JSON data from the input file
    with open(input_file, 'r') as file:
        data = json.load(file)

    # Create a dictionary to store pretty names and their counts
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
        pretty_name = item["pretty_name"]
        field_path = item["field_path"]

        # Check if the pretty_name is in the set of names to update
        if pretty_name in pretty_names_to_update:
            parent_name = field_path.split('.')[-2]
            new_pretty_name = f"{parent_name} {pretty_name}"
            item["pretty_name"] = new_pretty_name

    # Write the updated data back to the input file
    with open(input_file, 'w') as file:
        json.dump(data, file, indent=2)


input_file = "output.json"
update_duplicate_pretty_names(input_file)
