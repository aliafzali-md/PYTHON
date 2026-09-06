count = 10
def show():
    count = 5
    return count
print(show(), count)

def uses_global():
    return count * 2
print(uses_global())

def mutates(lst):
    lst.append(99)
print
items = [1]
mutates(items)
print(items)

def rebinds(lst):
    lst = [0]
    return lst
original = [1]
print(rebinds(original), original)
