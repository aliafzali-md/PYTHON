def average(values):
    if len(values) == 0:
        return 0
    return sum(values) / len(values)

scores = [90, 85, 77, 100]
print(f"Average: {average(scores):.2f}")

names = ["ali", "sam", "kim"]
upper_names = []
for n in names:
    upper_names.append(n.capitalize())
print(upper_names)

inventory = {"apples": 3, "pears": 0}
for item in sorted(inventory.keys()):
    count = inventory[item]
    status = "in stock" if count > 0 else "out of stock"
    print(f"{item}: {status} ({count})")

word = "racecar"
print(word == word[::-1])

total = 0
for i in range(1, 101):
    if i % 3 == 0 or i % 5 == 0:
        total += i
print(total)
