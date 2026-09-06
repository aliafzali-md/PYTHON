grid = [[1, 2], [3, 4]]
print(grid, grid[1][0])
for row in grid:
    for cell in row:
        print(cell, end=" ")
print()
people = [{"name": "Ali", "age": 30}, {"name": "Sam", "age": 25}]
for p in people:
    print(f"{p['name']} is {p['age']}")
by_name = {}
for p in people:
    by_name[p["name"]] = p["age"]
print(by_name)
alias = grid[0]
alias.append(9)
print(grid)
