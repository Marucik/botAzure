let content = [
    `So far we have played around with Python commands in the Python shell. We want to write now our first serious Python program. You will hardly find any beginner's textbook on programming, which don't start with the "nearly mandatory" "Hello World" program, i.e. a program which prints the string "Hello World". This looks on the Python shell like this:`,
    `$ python3
    Python 3.4.0 (default, Apr 11 2014, 13:05:11) 
    [GCC 4.8.2] on linux
    Type "help", "copyright", "credits" or "license" for more information.
    >>> print("Hello World!")
    Hello World!
    >>> `,
    `But, as we said at the beginning, we want to write a "serious" script now. We use a slight variation of the "Hello World" theme. We have to include our print statement into a file. To save and edit our program in a file we need an editor. There are lots of editors, but you should choose one, which supports syntax highlighting and indentation. Under Linux you can use vi, vim, emacs, geany, gedit and umpteen others. The emacs works under windows as well, but notepad++ may be the better choice in many cases. `,
    `So, after you have found the editor of your choice, you can input your mini script, i.e.
    print("My first simple Python script!")
    and save it as my_first_simple_script.py. 
    The suffix .py is not really necessary under Linux but it's good style to use it. But the extension is essential, if you want to write modules.
    `,
    `Start a Python script\n\nLet's assume our script is in a subdirectory under the home directory of user monty:\n\n
    monty@python:~$ cd python\n
    monty@python:~/python$ python my_first_simple_script.py\n
    My first simple Python script!\n
    monty@python:~/python$\n\n
    It can be started under Windows in a Command prompt (start -> All Programs -> Accessories -> Command Prompt):
    `,
    `Python Internals\n\nMost probably you will have read somewhere that the Python language is an interpreted programming or a script language. The truth is: Python is both an interpreted and a compiled language. But calling Python a compiled language would be misleading. (At the end of this chapter, you will find the definitions for Compilers and Interpreters, if you are not familiar with the concepts!) People would assume that the compiler translates the Python code into machine language. Python code is translated into intermediate code, which has to be executed by a virtual machine, known as the PVM, the Python virtual machine. This is a similar approach to the one taken by Java. There is even a way of translating Python programs into Java byte code for the Java Virtual Machine (JVM). This can be achieved with Jython.`,
    `The question is, do I have to compile my Python scripts to make them faster or how can I compile them? The answer is easy: Normally, you don't need to do anything and you shouldn't bother, because "Python" is doing the thinking for you, i.e. it takes the necessary steps automatically.\n\n
    For whatever reason you want to compile a python program manually? No problem. It can be done with the module py_compile, either using the interpreter shell\n
    >>> import py_compile\n
    >>> py_compile.compile('my_first_simple_script.py')\n
    >>> \n
    or using the following command at the shell prompt\n
    python -m py_compile my_first_simple_script.py`
];

module.exports = content;
