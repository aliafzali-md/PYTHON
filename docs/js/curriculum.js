// The course. Each level runs learn -> code -> reflect.
//
// Exercise tests come in three shapes, all checked by running real code:
//   {stdout: "..."}                     compare everything the program printed
//   {variable: "x", expect: "5"}        compare a variable the program left behind
//   {call: "f(2)", expect: "4"}         call the learner's function and compare
// `expect` is a Python expression, evaluated to a value rather than a string,
// so 5 and 5.0 and "5" can never be confused with each other.

export const LEVELS = [
  // -------------------------------------------------------------------------
  {
    id: 'variables',
    title: 'Variables & Types',
    tagline: 'Boxes with names on them',
    icon: '📦',
    lesson: [
      {
        heading: 'Storing a value',
        body: 'A variable is a name for a value. You make one with `=`, and Python remembers it for later.\n\nRead `age = 30` as "age *becomes* 30" — not "age equals 30". The name goes on the left, the value on the right.',
        code: 'name = "Ali"\nage = 30\nprint(name)\nprint(age)',
        output: 'Ali\n30',
      },
      {
        heading: 'The four types you need first',
        body: 'Every value has a type:\n\n- `str` — text, always in quotes: `"hello"`\n- `int` — whole numbers: `30`\n- `float` — numbers with a decimal point: `19.99`\n- `bool` — `True` or `False`\n\n`type()` tells you which one you have.',
        code: 'print(type("hello"))\nprint(type(30))\nprint(type(19.99))\nprint(type(True))',
        output: "<class 'str'>\n<class 'int'>\n<class 'float'>\n<class 'bool'>",
      },
      {
        heading: 'Variables can change',
        body: 'Assigning again replaces the old value. `score = score + 5` reads the current value, adds 5, and stores the result back.\n\n`score += 5` is a shortcut for exactly that.',
        code: 'score = 10\nscore = score + 5\nprint(score)\nscore += 5\nprint(score)',
        output: '15\n20',
      },
    ],
    exercises: [
      {
        id: 'vars-1',
        brief: 'Create a variable `city` holding the text `Paris`, and a variable `population` holding the number `2141000`. Then print each of them.',
        starter: '# Your code here\n',
        tests: [
          { variable: 'city', expect: '"Paris"' },
          { variable: 'population', expect: '2141000' },
          { stdout: 'Paris\n2141000\n' },
        ],
        hints: [
          'Text needs quotes around it. Numbers do not.',
          'Use `=` to store a value: `city = "Paris"`.',
          'city = "Paris"\npopulation = 2141000\nprint(city)\nprint(population)',
        ],
        solution: 'city = "Paris"\npopulation = 2141000\nprint(city)\nprint(population)',
      },
      {
        id: 'vars-2',
        brief: 'Create `price` set to `19.99` and `in_stock` set to `True`. Print the *type* of each, in that order.',
        starter: 'price = \nin_stock = \n',
        tests: [{ stdout: "<class 'float'>\n<class 'bool'>\n" }],
        hints: [
          '`type(x)` gives you the type of `x`. You still need to print it.',
          'Wrap it: `print(type(price))`.',
          'price = 19.99\nin_stock = True\nprint(type(price))\nprint(type(in_stock))',
        ],
        solution: 'price = 19.99\nin_stock = True\nprint(type(price))\nprint(type(in_stock))',
      },
      {
        id: 'vars-3',
        brief: 'A player starts with `score` of `10`. Add `5` to it, then double it. Print the final score. (It should be `30`.)',
        starter: 'score = 10\n',
        tests: [
          { variable: 'score', expect: '30' },
          { stdout: '30\n' },
        ],
        hints: [
          'Do it in two steps: first add 5, then multiply by 2.',
          '`score += 5` adds 5. `score *= 2` doubles it.',
          'score = 10\nscore += 5\nscore *= 2\nprint(score)',
        ],
        solution: 'score = 10\nscore += 5\nscore *= 2\nprint(score)',
      },
    ],
    qa: [
      {
        question: 'What does `=` mean in Python?',
        options: ['Store the value on the right into the name on the left', 'Check whether two things are equal', 'Create a permanent constant'],
        answer: 0,
        explain: '`=` assigns. Checking equality is `==`, which you will meet in the Conditionals level.',
      },
      {
        question: 'What is the type of `19.99`?',
        options: ['int', 'float', 'str'],
        answer: 1,
        explain: 'A number with a decimal point is a `float`. Without one it would be an `int`.',
      },
      {
        question: 'After `x = 5` then `x = "five"`, what is `x`?',
        options: ['An error — you cannot change type', 'The number 5', 'The text "five"'],
        answer: 2,
        explain: 'Assigning again fully replaces the value, and Python is happy for the type to change.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'strings',
    title: 'Strings',
    tagline: 'Working with text',
    icon: '🔤',
    lesson: [
      {
        heading: 'Text has positions',
        body: 'Every character in a string has a number, counting from **0**. `word[0]` is the first character.\n\nNegative numbers count from the end, so `word[-1]` is the last character. `len(word)` gives you how many characters there are.',
        code: 'word = "python"\nprint(word[0])\nprint(word[-1])\nprint(len(word))',
        output: 'p\nn\n6',
      },
      {
        heading: 'Slicing out a piece',
        body: '`word[start:end]` gives you a section. The start is included, the end is **not** — so `word[0:3]` gives you characters 0, 1 and 2.\n\nLeave a side blank to mean "all the way": `word[:3]` from the start, `word[3:]` to the end.',
        code: 'word = "programming"\nprint(word[0:3])\nprint(word[3:7])\nprint(word[:3])\nprint(word[8:])',
        output: 'pro\ngram\npro\ning',
      },
      {
        heading: 'Methods and f-strings',
        body: 'Strings come with built-in actions, written `text.method()`: `.upper()`, `.lower()`, `.strip()`, `.replace(a, b)`, `.split()`.\n\nTo build a sentence out of variables, put `f` before the quote and drop names in `{curly braces}`.',
        code: 'name = "ali"\nprint(name.upper())\nprint(f"Hello, {name.capitalize()}!")\nprint("a,b,c".split(","))',
        output: "ALI\nHello, Ali!\n['a', 'b', 'c']",
      },
    ],
    exercises: [
      {
        id: 'str-1',
        brief: 'The variable `word` is set for you. Print its first character, then its last character, then the whole word in uppercase — one per line.',
        starter: 'word = "python"\n',
        tests: [{ stdout: 'p\nn\nPYTHON\n' }],
        hints: [
          'Counting starts at 0, and `-1` means the last one.',
          '`word[0]`, `word[-1]`, and `word.upper()`.',
          'word = "python"\nprint(word[0])\nprint(word[-1])\nprint(word.upper())',
        ],
        solution: 'word = "python"\nprint(word[0])\nprint(word[-1])\nprint(word.upper())',
      },
      {
        id: 'str-2',
        brief: 'From `"programming"`, pull out the middle piece `"gram"` and store it in a variable called `piece`. Print it.',
        starter: 'text = "programming"\npiece = \n',
        tests: [
          { variable: 'piece', expect: '"gram"' },
          { stdout: 'gram\n' },
        ],
        hints: [
          'Count the positions: p=0, r=1, o=2, g=3 — so "gram" starts at 3.',
          'The end position is not included, so you need `[3:7]`.',
          'text = "programming"\npiece = text[3:7]\nprint(piece)',
        ],
        solution: 'text = "programming"\npiece = text[3:7]\nprint(piece)',
      },
      {
        id: 'str-3',
        brief: 'Using the given `name` and `age`, print exactly: `Ali is 30 years old` — build it with an f-string.',
        starter: 'name = "Ali"\nage = 30\n',
        tests: [{ stdout: 'Ali is 30 years old\n' }],
        hints: [
          'Start the string with `f` before the opening quote.',
          'Put each variable in braces: `f"{name} is ..."`.',
          'name = "Ali"\nage = 30\nprint(f"{name} is {age} years old")',
        ],
        solution: 'name = "Ali"\nage = 30\nprint(f"{name} is {age} years old")',
      },
    ],
    qa: [
      {
        question: 'What does `"hello"[1]` give you?',
        options: ['"h"', '"e"', '"he"'],
        answer: 1,
        explain: 'Counting starts at 0, so position 1 is the second character.',
      },
      {
        question: 'Why does `"python"[0:3]` give `"pyt"` and not `"pyth"`?',
        options: ['The end position is not included', 'Slices always drop the last character', 'It is a bug'],
        answer: 0,
        explain: 'A slice runs up to but not including the end position. That is why `[0:3]` has exactly 3 characters.',
      },
      {
        question: 'What does `.upper()` do to the original variable?',
        options: ['Changes it in place', 'Nothing — it returns a new string'],
        answer: 1,
        explain: 'Strings never change. Methods hand back a new string, which you must store or print.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'numbers',
    title: 'Numbers & Math',
    tagline: 'Counting, dividing, rounding',
    icon: '🔢',
    lesson: [
      {
        heading: 'The operators',
        body: '`+` `-` `*` work as you expect. Division is where Python surprises people:\n\n- `/` always gives a **float**: `10 / 2` is `5.0`, not `5`\n- `//` divides and throws away the remainder: `7 // 2` is `3`\n- `%` gives you *only* the remainder: `7 % 2` is `1`\n- `**` is power: `2 ** 3` is `8`',
        code: 'print(10 / 2)\nprint(7 // 2)\nprint(7 % 2)\nprint(2 ** 3)',
        output: '5.0\n3\n1\n8',
      },
      {
        heading: 'Why // and % matter',
        body: 'Together they split a number into parts. To turn 125 minutes into hours and minutes: `125 // 60` is 2 hours, and `125 % 60` is 5 minutes left over.\n\n`%` is also the standard even/odd test: if `n % 2` is `0`, `n` is even.',
        code: 'total = 125\nprint(total // 60)\nprint(total % 60)\nprint(10 % 2)\nprint(7 % 2)',
        output: '2\n5\n0\n1',
      },
      {
        heading: 'Rounding and converting',
        body: '`round(x, digits)` rounds. `abs(x)` drops the minus sign. `int(x)` chops off the decimal part (it does *not* round), and `float(x)` adds one.\n\nCareful: `int("12")` turns text into a number, but `int("hi")` is an error.',
        code: 'print(round(3.14159, 2))\nprint(abs(-7))\nprint(int(3.9))\nprint(int("12") + 1)',
        output: '3.14\n7\n3\n13',
      },
    ],
    exercises: [
      {
        id: 'num-1',
        brief: 'Three test scores are given. Store their average in a variable called `average` and print it. (It should be `84.0`.)',
        starter: 'a = 90\nb = 85\nc = 77\n',
        tests: [
          { variable: 'average', expect: '84.0' },
          { stdout: '84.0\n' },
        ],
        hints: [
          'Add all three, then divide by how many there are.',
          'Wrap the addition in brackets so it happens first: `(a + b + c) / 3`.',
          'a = 90\nb = 85\nc = 77\naverage = (a + b + c) / 3\nprint(average)',
        ],
        solution: 'a = 90\nb = 85\nc = 77\naverage = (a + b + c) / 3\nprint(average)',
      },
      {
        id: 'num-2',
        brief: 'Turn `seconds` into minutes and seconds. Print the minutes on one line and the leftover seconds on the next. For 3725 that is `62` then `5`.',
        starter: 'seconds = 3725\n',
        tests: [{ stdout: '62\n5\n' }],
        hints: [
          'There are 60 seconds in a minute.',
          '`//` gives whole minutes, `%` gives what is left over.',
          'seconds = 3725\nprint(seconds // 60)\nprint(seconds % 60)',
        ],
        solution: 'seconds = 3725\nprint(seconds // 60)\nprint(seconds % 60)',
      },
      {
        id: 'num-3',
        brief: 'A `19.99` item has `8.5%` tax. Store the total (price plus tax) rounded to 2 decimal places in `total`, and print it. Expect `21.69`.',
        starter: 'price = 19.99\ntax_rate = 0.085\n',
        tests: [
          { variable: 'total', expect: '21.69' },
          { stdout: '21.69\n' },
        ],
        hints: [
          'The tax amount is the price times the rate.',
          'Add the tax to the price, then use `round(x, 2)`.',
          'price = 19.99\ntax_rate = 0.085\ntotal = round(price + price * tax_rate, 2)\nprint(total)',
        ],
        solution: 'price = 19.99\ntax_rate = 0.085\ntotal = round(price + price * tax_rate, 2)\nprint(total)',
      },
    ],
    qa: [
      {
        question: 'What does `10 / 2` print?',
        options: ['5', '5.0', '"5"'],
        answer: 1,
        explain: '`/` always produces a float, even when the division is exact. Use `//` if you want the int `5`.',
      },
      {
        question: 'How do you test whether `n` is even?',
        options: ['n // 2 == 0', 'n % 2 == 0', 'n / 2 == 0'],
        answer: 1,
        explain: '`%` gives the remainder. An even number divided by 2 leaves nothing behind.',
      },
      {
        question: 'What is `int(3.9)`?',
        options: ['4', '3', '3.9'],
        answer: 1,
        explain: '`int()` chops the decimal part off rather than rounding. Use `round()` if you want 4.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'lists',
    title: 'Lists',
    tagline: 'Many values, one name',
    icon: '📋',
    lesson: [
      {
        heading: 'A list holds things in order',
        body: 'Square brackets, values separated by commas. Same as strings, positions start at 0 and `-1` is the last one.\n\n`len()` counts the items.',
        code: 'scores = [90, 85, 77]\nprint(scores)\nprint(scores[0])\nprint(scores[-1])\nprint(len(scores))',
        output: '[90, 85, 77]\n90\n77\n3',
      },
      {
        heading: 'Lists can change',
        body: 'Unlike strings, you can modify a list after making it:\n\n- `.append(x)` adds to the end\n- `.insert(i, x)` adds at a position\n- `.remove(x)` deletes the first matching value\n- `.pop()` removes and hands back the last item\n\nYou can also assign straight into a position: `scores[0] = 100`.',
        code: 'items = ["a", "b"]\nitems.append("c")\nprint(items)\nitems[0] = "z"\nprint(items)\nprint(items.pop())\nprint(items)',
        output: "['a', 'b', 'c']\n['z', 'b', 'c']\nc\n['z', 'b']",
      },
      {
        heading: 'Asking questions about a list',
        body: '`sum()`, `min()`, `max()` and `sorted()` all take a list. `sorted()` hands back a *new* sorted list, while `.sort()` rearranges the one you have.\n\n`in` checks membership.',
        code: 'nums = [5, 3, 9]\nprint(sum(nums))\nprint(max(nums))\nprint(sorted(nums))\nprint(3 in nums)',
        output: '17\n9\n[3, 5, 9]\nTrue',
      },
    ],
    exercises: [
      {
        id: 'list-1',
        brief: 'Add `"cherry"` to the end of the shopping list, then print the list and its length on separate lines.',
        starter: 'shopping = ["apple", "banana"]\n',
        tests: [
          { variable: 'shopping', expect: '["apple", "banana", "cherry"]' },
          { stdout: "['apple', 'banana', 'cherry']\n3\n" },
        ],
        hints: [
          '`.append()` adds one item to the end.',
          'Then `print(shopping)` and `print(len(shopping))`.',
          'shopping = ["apple", "banana"]\nshopping.append("cherry")\nprint(shopping)\nprint(len(shopping))',
        ],
        solution: 'shopping = ["apple", "banana"]\nshopping.append("cherry")\nprint(shopping)\nprint(len(shopping))',
      },
      {
        id: 'list-2',
        brief: 'Print the highest score, the lowest score, and the total — one per line.',
        starter: 'scores = [72, 95, 68, 88]\n',
        tests: [{ stdout: '95\n68\n323\n' }],
        hints: [
          'There are built-in functions for all three.',
          '`max()`, `min()` and `sum()`.',
          'scores = [72, 95, 68, 88]\nprint(max(scores))\nprint(min(scores))\nprint(sum(scores))',
        ],
        solution: 'scores = [72, 95, 68, 88]\nprint(max(scores))\nprint(min(scores))\nprint(sum(scores))',
      },
      {
        id: 'list-3',
        brief: 'Store a sorted copy of `names` in a variable called `ordered` — leaving `names` itself untouched — then print `ordered` and `names`.',
        starter: 'names = ["zoe", "adam", "mia"]\n',
        tests: [
          { variable: 'ordered', expect: '["adam", "mia", "zoe"]' },
          { variable: 'names', expect: '["zoe", "adam", "mia"]' },
        ],
        hints: [
          '`.sort()` would change `names` itself — you want the other one.',
          '`sorted(names)` returns a new list and leaves the original alone.',
          'names = ["zoe", "adam", "mia"]\nordered = sorted(names)\nprint(ordered)\nprint(names)',
        ],
        solution: 'names = ["zoe", "adam", "mia"]\nordered = sorted(names)\nprint(ordered)\nprint(names)',
      },
    ],
    qa: [
      {
        question: 'What is the difference between `sorted(x)` and `x.sort()`?',
        options: ['Nothing', '`sorted()` returns a new list; `.sort()` rearranges the original', '`.sort()` only works on numbers'],
        answer: 1,
        explain: '`.sort()` changes the list in place and returns `None`. `sorted()` leaves the original alone.',
      },
      {
        question: 'What does `len([10, 20, 30])` give?',
        options: ['3', '30', '60'],
        answer: 0,
        explain: '`len()` counts items, it does not look at their values.',
      },
      {
        question: 'Which position holds the last item of any list `x`?',
        options: ['x[len(x)]', 'x[-1]', 'x[0]'],
        answer: 1,
        explain: '`x[-1]` is the last item. `x[len(x)]` is one past the end and raises IndexError.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'dicts',
    title: 'Dictionaries',
    tagline: 'Look things up by name',
    icon: '🗂️',
    lesson: [
      {
        heading: 'Key to value',
        body: 'A list finds things by position. A dictionary finds them by **key** — usually a word.\n\nCurly braces, and each entry is `key: value`.',
        code: 'person = {"name": "Ali", "age": 30}\nprint(person["name"])\nprint(person["age"])\nprint(len(person))',
        output: 'Ali\n30\n2',
      },
      {
        heading: 'Adding and safe lookup',
        body: 'Assign to a new key to add it. Looking up a key that does not exist is a `KeyError` — so when you are not sure, use `.get()`, which hands back `None` (or a default you choose) instead of crashing.',
        code: 'person = {"name": "Ali"}\nperson["city"] = "Paris"\nprint(person)\nprint(person.get("age"))\nprint(person.get("age", 0))',
        output: "{'name': 'Ali', 'city': 'Paris'}\nNone\n0",
      },
      {
        heading: 'Looping through',
        body: '`.items()` hands you the key and the value together, which you can unpack into two names in one go.\n\n`in` checks whether a **key** exists.',
        code: 'stock = {"apples": 3, "pears": 0}\nfor item, count in stock.items():\n    print(item, count)\nprint("apples" in stock)',
        output: 'apples 3\npears 0\nTrue',
      },
    ],
    exercises: [
      {
        id: 'dict-1',
        brief: 'Add a `"city"` of `"Paris"` to the dictionary, then print the person\'s name and then the whole dictionary.',
        starter: 'person = {"name": "Ali", "age": 30}\n',
        tests: [
          { variable: 'person', expect: '{"name": "Ali", "age": 30, "city": "Paris"}' },
          { stdout: "Ali\n{'name': 'Ali', 'age': 30, 'city': 'Paris'}\n" },
        ],
        hints: [
          'Assigning to a key that does not exist yet creates it.',
          '`person["city"] = "Paris"`.',
          'person = {"name": "Ali", "age": 30}\nperson["city"] = "Paris"\nprint(person["name"])\nprint(person)',
        ],
        solution: 'person = {"name": "Ali", "age": 30}\nperson["city"] = "Paris"\nprint(person["name"])\nprint(person)',
      },
      {
        id: 'dict-2',
        brief: 'Print how many `"pears"` are in stock, then how many `"plums"` are — using a lookup that gives `0` instead of crashing when the item is missing.',
        starter: 'stock = {"apples": 3, "pears": 7}\n',
        tests: [{ stdout: '7\n0\n' }],
        hints: [
          '`stock["plums"]` would raise a KeyError.',
          '`.get()` takes a second argument: the value to use when the key is missing.',
          'stock = {"apples": 3, "pears": 7}\nprint(stock.get("pears", 0))\nprint(stock.get("plums", 0))',
        ],
        solution: 'stock = {"apples": 3, "pears": 7}\nprint(stock.get("pears", 0))\nprint(stock.get("plums", 0))',
      },
      {
        id: 'dict-3',
        brief: 'Loop over the prices and print one line per entry in the form `apple costs 2` — keeping the original order.',
        starter: 'prices = {"apple": 2, "bread": 3, "milk": 1}\n',
        tests: [{ stdout: 'apple costs 2\nbread costs 3\nmilk costs 1\n' }],
        hints: [
          '`.items()` gives you both parts at once.',
          '`for name, price in prices.items():` then print an f-string.',
          'prices = {"apple": 2, "bread": 3, "milk": 1}\nfor name, price in prices.items():\n    print(f"{name} costs {price}")',
        ],
        solution: 'prices = {"apple": 2, "bread": 3, "milk": 1}\nfor name, price in prices.items():\n    print(f"{name} costs {price}")',
      },
    ],
    qa: [
      {
        question: 'What happens with `d["missing"]` when the key is not there?',
        options: ['It returns None', 'It raises a KeyError', 'It creates the key'],
        answer: 1,
        explain: 'Square-bracket lookup raises KeyError. `.get()` is the safe version.',
      },
      {
        question: 'What does `for k, v in d.items():` give you each time round?',
        options: ['Only the keys', 'Only the values', 'The key and the value together'],
        answer: 2,
        explain: '`.items()` hands back key/value pairs, which unpack neatly into two names.',
      },
      {
        question: 'When would you reach for a dictionary instead of a list?',
        options: ['When order is all that matters', 'When you want to look things up by a name', 'When you only have numbers'],
        answer: 1,
        explain: 'Lists answer "what is at position 3?". Dictionaries answer "what is the price of bread?".',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'conditionals',
    title: 'Conditionals',
    tagline: 'Making decisions',
    icon: '🔀',
    lesson: [
      {
        heading: 'if / elif / else',
        body: 'Python checks each test in order and runs the **first** one that is true, then skips the rest.\n\nThe colon and the indent are both required — the indented lines are what runs.',
        code: 'score = 75\nif score >= 90:\n    print("A")\nelif score >= 70:\n    print("B")\nelse:\n    print("C")',
        output: 'B',
      },
      {
        heading: 'Comparing things',
        body: '`==` equal, `!=` not equal, `<` `>` `<=` `>=`.\n\nThe classic trap: `=` stores a value, `==` compares. Use `==` inside an `if`.',
        code: 'age = 20\nprint(age == 20)\nprint(age != 20)\nprint(age >= 18)\nprint("a" == "A")',
        output: 'True\nFalse\nTrue\nFalse',
      },
      {
        heading: 'Combining tests',
        body: '`and` needs both sides true. `or` needs at least one. `not` flips it.\n\nYou can also chain: `0 < x < 10` reads exactly as it looks.',
        code: 'age = 25\nmember = False\nprint(age > 18 and age < 65)\nprint(member or age > 21)\nprint(not member)\nprint(0 < age < 100)',
        output: 'True\nTrue\nTrue\nTrue',
      },
    ],
    exercises: [
      {
        id: 'cond-1',
        brief: 'Print a grade for `score`: `A` for 90 or above, `B` for 80-89, `C` for 70-79, otherwise `F`. With the given 85 it should print `B`.',
        starter: 'score = 85\n',
        tests: [{ stdout: 'B\n' }],
        hints: [
          'Check the highest grade first, then work downwards.',
          'Once you know it is below 90, `elif score >= 80` is enough for B.',
          'score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelif score >= 70:\n    print("C")\nelse:\n    print("F")',
        ],
        solution: 'score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelif score >= 70:\n    print("C")\nelse:\n    print("F")',
      },
      {
        id: 'cond-2',
        brief: 'Print `even` if `number` divides by 2 with nothing left over, otherwise print `odd`.',
        starter: 'number = 7\n',
        tests: [{ stdout: 'odd\n' }],
        hints: [
          'The remainder operator `%` is the tool here.',
          '`if number % 2 == 0:` means "no remainder".',
          'number = 7\nif number % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
        ],
        solution: 'number = 7\nif number % 2 == 0:\n    print("even")\nelse:\n    print("odd")',
      },
      {
        id: 'cond-3',
        brief: 'Print `welcome` only if the person is 18 or over **and** has a ticket. Otherwise print `denied`.',
        starter: 'age = 20\nhas_ticket = True\n',
        tests: [{ stdout: 'welcome\n' }],
        hints: [
          'Both conditions have to hold, so you need `and`.',
          '`has_ticket` is already True or False — you do not need `== True`.',
          'age = 20\nhas_ticket = True\nif age >= 18 and has_ticket:\n    print("welcome")\nelse:\n    print("denied")',
        ],
        solution: 'age = 20\nhas_ticket = True\nif age >= 18 and has_ticket:\n    print("welcome")\nelse:\n    print("denied")',
      },
    ],
    qa: [
      {
        question: 'Why does an `if` need `==` rather than `=`?',
        options: ['They are the same', '`=` stores a value, `==` asks a question', '`==` is faster'],
        answer: 1,
        explain: '`=` is assignment. Inside an `if` you want the comparison, `==`.',
      },
      {
        question: 'In an if/elif/elif chain, how many branches run?',
        options: ['All the true ones', 'Only the first true one', 'Always exactly one'],
        answer: 1,
        explain: 'Python takes the first branch that is true and skips the rest — which is why you order from most specific to least.',
      },
      {
        question: 'What does `age > 18 and has_ticket` need in order to be True?',
        options: ['Either part', 'Both parts', 'Neither'],
        answer: 1,
        explain: '`and` needs both sides. `or` is the one that needs only one.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'loops',
    title: 'Loops',
    tagline: 'Doing it again',
    icon: '🔁',
    lesson: [
      {
        heading: 'for: once per item',
        body: 'A `for` loop walks through a list, a string, or a range — one item at a time. The name after `for` holds the current item.\n\n`range(5)` counts 0, 1, 2, 3, 4. `range(2, 5)` counts 2, 3, 4.',
        code: 'for fruit in ["apple", "pear"]:\n    print(fruit)\nfor i in range(3):\n    print(i)',
        output: 'apple\npear\n0\n1\n2',
      },
      {
        heading: 'The accumulator pattern',
        body: 'This shape shows up constantly: start a variable at 0 (or an empty list), then add to it once per item.\n\nThe key is that the starting line sits *outside* the loop, and the adding sits *inside*.',
        code: 'nums = [5, 3, 9]\ntotal = 0\nfor n in nums:\n    total += n\nprint(total)',
        output: '17',
      },
      {
        heading: 'while, break and continue',
        body: 'A `while` loop keeps going as long as its test is true — so something inside must eventually make it false, or it runs forever.\n\n`break` leaves the loop immediately. `continue` skips to the next round.',
        code: 'n = 3\nwhile n > 0:\n    print(n)\n    n -= 1\nfor i in range(10):\n    if i == 3:\n        break\n    print(i)',
        output: '3\n2\n1\n0\n1\n2',
      },
    ],
    exercises: [
      {
        id: 'loop-1',
        brief: 'Print the squares of the numbers 1 to 5, one per line: `1`, `4`, `9`, `16`, `25`.',
        starter: '# Your code here\n',
        tests: [{ stdout: '1\n4\n9\n16\n25\n' }],
        hints: [
          '`range(1, 6)` counts 1 through 5 — remember the end is not included.',
          'Square with `n ** 2`.',
          'for n in range(1, 6):\n    print(n ** 2)',
        ],
        solution: 'for n in range(1, 6):\n    print(n ** 2)',
      },
      {
        id: 'loop-2',
        brief: 'Add up only the **even** numbers in the list, store the result in `total`, and print it. Expect `60`.',
        starter: 'nums = [10, 7, 20, 3, 30]\ntotal = 0\n',
        tests: [
          { variable: 'total', expect: '60' },
          { stdout: '60\n' },
        ],
        hints: [
          'Loop over every number, but only add some of them.',
          'Inside the loop: `if n % 2 == 0:` then `total += n`.',
          'nums = [10, 7, 20, 3, 30]\ntotal = 0\nfor n in nums:\n    if n % 2 == 0:\n        total += n\nprint(total)',
        ],
        solution: 'nums = [10, 7, 20, 3, 30]\ntotal = 0\nfor n in nums:\n    if n % 2 == 0:\n        total += n\nprint(total)',
      },
      {
        id: 'loop-3',
        brief: 'Count how many vowels (`a e i o u`) are in `word`, store it in `count`, and print it. For `"programming"` that is `3`.',
        starter: 'word = "programming"\ncount = 0\n',
        tests: [
          { variable: 'count', expect: '3' },
          { stdout: '3\n' },
        ],
        hints: [
          'You can loop over a string one character at a time.',
          '`if letter in "aeiou":` then add 1 to the count.',
          'word = "programming"\ncount = 0\nfor letter in word:\n    if letter in "aeiou":\n        count += 1\nprint(count)',
        ],
        solution: 'word = "programming"\ncount = 0\nfor letter in word:\n    if letter in "aeiou":\n        count += 1\nprint(count)',
      },
    ],
    qa: [
      {
        question: 'How many numbers does `range(1, 5)` produce?',
        options: ['5', '4', '3'],
        answer: 1,
        explain: '1, 2, 3, 4 — the end value is never included.',
      },
      {
        question: 'Why must `total = 0` sit outside the loop?',
        options: ['Style only', 'Inside, it would reset to 0 every time round', 'It would be an error inside'],
        answer: 1,
        explain: 'Resetting each round would throw away everything you had added so far, leaving only the last item.',
      },
      {
        question: 'What makes a `while` loop run forever?',
        options: ['Using `while` at all', 'Nothing inside ever makes the test false', 'Using `break`'],
        answer: 1,
        explain: 'If the condition never becomes false the loop never ends — which is why the counter must change inside.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'functions',
    title: 'Functions',
    tagline: 'Name it once, use it anywhere',
    icon: '⚙️',
    lesson: [
      {
        heading: 'Defining and calling',
        body: '`def` gives a block of code a name. Nothing happens when you define it — the code runs only when you **call** it with `name()`.\n\nValues in the brackets are *parameters*: names the function uses for whatever you pass in.',
        code: 'def greet(name):\n    print(f"Hello, {name}!")\n\ngreet("Ali")\ngreet("Sam")',
        output: 'Hello, Ali!\nHello, Sam!',
      },
      {
        heading: 'return hands a value back',
        body: '`print` shows something to a human. `return` gives a value back to your code so you can store or reuse it. They are not the same thing.\n\nA function with no `return` hands back `None`. `return` also exits the function immediately.',
        code: 'def double(n):\n    return n * 2\n\nresult = double(5)\nprint(result)\nprint(double(result))',
        output: '10\n20',
      },
      {
        heading: 'Default values',
        body: 'Giving a parameter a default makes it optional. Callers can override it when they want to.',
        code: 'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\nprint(greet("Ali"))\nprint(greet("Ali", "Welcome"))',
        output: 'Hello, Ali!\nWelcome, Ali!',
      },
    ],
    exercises: [
      {
        id: 'func-1',
        brief: 'Write a function `greet(name)` that **returns** the text `Hello, <name>!` — for example `greet("Ali")` gives `Hello, Ali!`. Do not print inside the function.',
        starter: 'def greet(name):\n    \n',
        tests: [
          { call: 'greet("Ali")', expect: '"Hello, Ali!"' },
          { call: 'greet("Sam")', expect: '"Hello, Sam!"' },
          { call: 'greet("")', expect: '"Hello, !"' },
        ],
        hints: [
          'The last line of the function should start with `return`.',
          'An f-string is the tidiest way: `return f"Hello, {name}!"`.',
          'def greet(name):\n    return f"Hello, {name}!"',
        ],
        solution: 'def greet(name):\n    return f"Hello, {name}!"',
      },
      {
        id: 'func-2',
        brief: 'Write `area(width, height)` returning width times height — but `height` should default to `1` when it is not given.',
        starter: 'def area(width, height):\n    \n',
        tests: [
          { call: 'area(3, 4)', expect: '12' },
          { call: 'area(5)', expect: '5' },
          { call: 'area(2, 10)', expect: '20' },
        ],
        hints: [
          'Give the parameter a default right in the `def` line.',
          '`def area(width, height=1):`',
          'def area(width, height=1):\n    return width * height',
        ],
        solution: 'def area(width, height=1):\n    return width * height',
      },
      {
        id: 'func-3',
        brief: 'Write `count_vowels(word)` returning how many vowels (`a e i o u`) the word contains. Empty text should give `0`.',
        starter: 'def count_vowels(word):\n    \n',
        tests: [
          { call: 'count_vowels("programming")', expect: '3' },
          { call: 'count_vowels("xyz")', expect: '0' },
          { call: 'count_vowels("")', expect: '0' },
          { call: 'count_vowels("aeiou")', expect: '5' },
        ],
        hints: [
          'Start a counter at 0 inside the function, loop, then return it.',
          'The `return` goes *after* the loop, not inside it.',
          'def count_vowels(word):\n    count = 0\n    for letter in word:\n        if letter in "aeiou":\n            count += 1\n    return count',
        ],
        solution: 'def count_vowels(word):\n    count = 0\n    for letter in word:\n        if letter in "aeiou":\n            count += 1\n    return count',
      },
    ],
    qa: [
      {
        question: 'What is the difference between `print` and `return`?',
        options: ['None', '`print` shows text to a person; `return` gives a value back to your code', '`return` is just a faster print'],
        answer: 1,
        explain: 'A function that prints but does not return hands back `None`, so `x = f()` would leave `x` as `None`.',
      },
      {
        question: 'When does the code inside a `def` actually run?',
        options: ['As soon as you define it', 'When you call the function', 'Once at the end of the program'],
        answer: 1,
        explain: 'Defining only stores the recipe. Calling it is what cooks.',
      },
      {
        question: 'In `count_vowels`, why must `return count` sit outside the loop?',
        options: ['Style only', 'Inside, it would return after the very first letter', 'It would not be allowed inside'],
        answer: 1,
        explain: '`return` exits immediately, so returning inside the loop would stop after one character.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    id: 'capstone',
    title: 'Capstone',
    tagline: 'Put it all together',
    icon: '🏆',
    lesson: [
      {
        heading: 'Everything at once',
        body: 'These last three use all of it — variables, strings, numbers, lists, dictionaries, conditionals, loops and functions.\n\nNothing new here. If you get stuck, the hints are still there, and the earlier levels are one tap away.',
        code: 'def summary(scores):\n    return f"{len(scores)} scores, best {max(scores)}"\n\nprint(summary([70, 95, 82]))',
        output: '3 scores, best 95',
      },
    ],
    exercises: [
      {
        id: 'cap-1',
        brief: 'Write `fizzbuzz(n)`: return `"Fizz"` if `n` divides by 3, `"Buzz"` if by 5, `"FizzBuzz"` if by both, otherwise the number as text.',
        starter: 'def fizzbuzz(n):\n    \n',
        tests: [
          { call: 'fizzbuzz(3)', expect: '"Fizz"' },
          { call: 'fizzbuzz(5)', expect: '"Buzz"' },
          { call: 'fizzbuzz(15)', expect: '"FizzBuzz"' },
          { call: 'fizzbuzz(7)', expect: '"7"' },
          { call: 'fizzbuzz(30)', expect: '"FizzBuzz"' },
        ],
        hints: [
          'Check the "both" case first — otherwise 15 matches Fizz and stops there.',
          'Use `n % 3 == 0 and n % 5 == 0` as the first test.',
          'def fizzbuzz(n):\n    if n % 3 == 0 and n % 5 == 0:\n        return "FizzBuzz"\n    if n % 3 == 0:\n        return "Fizz"\n    if n % 5 == 0:\n        return "Buzz"\n    return str(n)',
        ],
        solution: 'def fizzbuzz(n):\n    if n % 3 == 0 and n % 5 == 0:\n        return "FizzBuzz"\n    if n % 3 == 0:\n        return "Fizz"\n    if n % 5 == 0:\n        return "Buzz"\n    return str(n)',
      },
      {
        id: 'cap-2',
        brief: 'Write `count_words(text)` returning a dictionary mapping each word to how many times it appears. `"a b a"` gives `{"a": 2, "b": 1}`.',
        starter: 'def count_words(text):\n    \n',
        tests: [
          { call: 'count_words("a b a")', expect: '{"a": 2, "b": 1}' },
          { call: 'count_words("hi")', expect: '{"hi": 1}' },
          { call: 'count_words("")', expect: '{}' },
          { call: 'count_words("x x x")', expect: '{"x": 3}' },
        ],
        hints: [
          '`text.split()` breaks the text into a list of words.',
          'Start with an empty dict, then `counts[word] = counts.get(word, 0) + 1`.',
          'def count_words(text):\n    counts = {}\n    for word in text.split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts',
        ],
        solution: 'def count_words(text):\n    counts = {}\n    for word in text.split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts',
      },
      {
        id: 'cap-3',
        brief: 'Write `receipt(items)` — `items` is a dict of name to price. Return the total, rounded to 2 decimals, but skip any item priced `0` or less. An empty dict gives `0`.',
        starter: 'def receipt(items):\n    \n',
        tests: [
          { call: 'receipt({"apple": 1.5, "bread": 2.25})', expect: '3.75' },
          { call: 'receipt({"free": 0, "apple": 1.5})', expect: '1.5' },
          { call: 'receipt({})', expect: '0' },
          { call: 'receipt({"a": -1, "b": 2.005})', expect: '2.0' },
        ],
        hints: [
          'Loop over `items.values()` and add up the ones you want.',
          'Skip with `if price <= 0: continue`, then `round(total, 2)` at the end.',
          'def receipt(items):\n    total = 0\n    for price in items.values():\n        if price <= 0:\n            continue\n        total += price\n    return round(total, 2)',
        ],
        solution: 'def receipt(items):\n    total = 0\n    for price in items.values():\n        if price <= 0:\n            continue\n        total += price\n    return round(total, 2)',
      },
    ],
    qa: [
      {
        question: 'In FizzBuzz, why check "divisible by both" first?',
        options: ['It reads better', 'Otherwise 15 matches the Fizz test and returns early', 'It is faster'],
        answer: 1,
        explain: 'The first matching branch wins, so the most specific case has to come first.',
      },
      {
        question: 'Why is `counts.get(word, 0) + 1` better than `counts[word] + 1`?',
        options: ['Shorter', 'The first time a word appears it has no entry yet, so `[]` would raise KeyError', 'No difference'],
        answer: 1,
        explain: '`.get(word, 0)` treats an unseen word as 0, which is exactly what a counter needs.',
      },
    ],
  },
];

export const TOTAL_EXERCISES = LEVELS.reduce((n, level) => n + level.exercises.length, 0);

/** The syntax reference behind the in-game help() button, per level. */
export const HELP = {
  variables: [
    ['name = value', 'store a value under a name'],
    ['type(x)', 'ask what type a value is'],
    ['x += 1', 'add to what is already there'],
    ['print(x)', 'show a value'],
  ],
  strings: [
    ['text[0]', 'first character (counting starts at 0)'],
    ['text[-1]', 'last character'],
    ['text[1:4]', 'a slice; the end is not included'],
    ['len(text)', 'how many characters'],
    ['.upper() .lower()', 'change case'],
    ['.strip()', 'remove surrounding spaces'],
    ['.replace(a, b)', 'swap one piece for another'],
    ['.split(",")', 'break into a list'],
    ['f"hi {name}"', 'build text from variables'],
  ],
  numbers: [
    ['+ - * ', 'the usual arithmetic'],
    ['/', 'divide — always gives a float'],
    ['//', 'divide and drop the remainder'],
    ['%', 'the remainder only'],
    ['**', 'to the power of'],
    ['round(x, 2)', 'round to 2 decimal places'],
    ['abs(x)', 'drop the minus sign'],
    ['int(x)  float(x)', 'convert between number types'],
  ],
  lists: [
    ['[1, 2, 3]', 'make a list'],
    ['x[0]  x[-1]', 'first and last item'],
    ['x[1:3]', 'a slice of the list'],
    ['.append(v)', 'add to the end'],
    ['.insert(i, v)', 'add at a position'],
    ['.remove(v)  .pop()', 'take items out'],
    ['.sort()', 'rearrange this list'],
    ['sorted(x)', 'a new sorted list'],
    ['len sum min max', 'ask about the whole list'],
    ['v in x', 'is it there?'],
  ],
  dicts: [
    ['{"k": 1}', 'make a dictionary'],
    ['d["k"]', 'look up a key (errors if missing)'],
    ['d.get("k", 0)', 'look up with a fallback'],
    ['d["new"] = 1', 'add or replace'],
    ['.keys() .values()', 'just one side'],
    ['.items()', 'key and value together'],
    ['"k" in d', 'does that key exist?'],
    ['len(d)', 'how many entries'],
  ],
  conditionals: [
    ['if x > 5:', 'run when the test is true'],
    ['elif x > 2:', 'check next, only if earlier ones failed'],
    ['else:', 'when nothing else matched'],
    ['==  !=', 'equal, not equal'],
    ['<  >  <=  >=', 'compare sizes'],
    ['and  or  not', 'combine tests'],
    ['0 < x < 10', 'chain a range check'],
  ],
  loops: [
    ['for item in things:', 'once per item'],
    ['range(5)', '0, 1, 2, 3, 4'],
    ['range(2, 6)', '2, 3, 4, 5'],
    ['range(10, 0, -1)', 'count downwards'],
    ['while test:', 'keep going while true'],
    ['break', 'leave the loop now'],
    ['continue', 'skip to the next round'],
    ['total += n', 'the accumulator pattern'],
  ],
  functions: [
    ['def name(a, b):', 'define a function'],
    ['return value', 'hand a value back'],
    ['def f(a, b=1):', 'give a parameter a default'],
    ['name(1, 2)', 'call it'],
    ['print vs return', 'show a human vs give code a value'],
  ],
  capstone: [
    ['.split()', 'text into a list of words'],
    ['d.get(k, 0)', 'safe lookup with a default'],
    ['round(x, 2)', 'round to 2 decimals'],
    ['str(n)', 'number into text'],
    ['continue', 'skip this item'],
  ],
};
