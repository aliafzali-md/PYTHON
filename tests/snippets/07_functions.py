def greet(name):
    return "Hello, " + name + "!"
print(greet("Ali"))

def add(a, b=10):
    return a + b
print(add(1), add(1, 2))

def no_return():
    x = 1
print(no_return())

def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
print(factorial(5))

def outer():
    total = 0
    for i in range(4):
        total += i
    return total
print(outer())

def swap(a, b):
    return b, a
print(swap(1, 2))
x, y = swap(3, 4)
print(x, y)

def apply_twice(n):
    return double(double(n))
def double(n):
    return n * 2
print(apply_twice(3))
