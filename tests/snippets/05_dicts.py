d = {"a": 1, "b": 2}
print(d, len(d))
d["c"] = 3
print(d)
print(d["a"], d.get("z"), d.get("z", 0))
print("a" in d, "z" in d)
print(list(d.keys()), list(d.values()))
for k, v in d.items():
    print(k, "->", v)
print(d.pop("a"))
print(d)
counts = {}
for ch in "hello":
    counts[ch] = counts.get(ch, 0) + 1
print(counts)
nested = {"x": [1, 2], "y": {"z": 3}}
print(nested["x"][1], nested["y"]["z"])
d2 = {1: "one", 2: "two"}
print(d2[1], d2)
