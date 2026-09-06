for i in range(3):
    print(i)
for i in range(2, 6):
    print(i)
for i in range(10, 0, -3):
    print(i)
n = 0
while n < 3:
    print("n =", n)
    n += 1
for i in range(10):
    if i == 3:
        continue
    if i > 5:
        break
    print(i)
x = 7
if x > 10:
    print("big")
elif x > 5:
    print("medium")
else:
    print("small")
print("yes" if x > 5 else "no")
for ch in "abc":
    print(ch)
for i, ch in enumerate("abc"):
    print(i, ch)
for a, b in zip([1, 2], ["x", "y"]):
    print(a, b)
