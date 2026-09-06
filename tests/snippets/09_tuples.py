t = (1, 2, 3)
print(t, len(t), t[0], t[-1])
print(t[1:])
single = (5,)
print(single)
empty = ()
print(empty)
a, b, c = t
print(a, b, c)
print(t.count(2), t.index(3))
print(tuple([1, 2]))
pairs = [(1, "a"), (2, "b")]
for num, letter in pairs:
    print(num, letter)
print((1, 2) + (3,))
