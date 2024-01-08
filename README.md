# package-list-js

List (and matrix, tables) package for the [Fōrmulæ](https://formulae.org) programming language.

Fōrmulæ is also a software framework for visualization, edition and manipulation of complex expressions, from many fields. The code for an specific field —i.e. arithmetics— is encapsulated in a single unit called a Fōrmulæ **package**.

This repository contains the source code for the **list package**. It is intended to the computation on lists. Despite the name, it includes a lot of expressions related to vectors, matrices (because a matrix y a list of -same cardinallity- subslists), and tables.

The GitHub organization [formulae-org](https://github.com/formulae-org) encompasses the source code for the rest of packages, as well as the [web application](https://github.com/formulae-org/formulae-js).

<!--
Take a look at this [tutorial](https://formulae.org/?script=tutorials/Complex) to know the capabilities of the Fōrmulæ arithmetic package.
-->

### Capabilities ###

* Visualization of expressions
    * List, it is shown as $`\{ element_1, element_2, ..., element_n \}`$
    * Matrix
    * Table

* Edition
    * Manual creation of a list. It creates a list with the currently selected expression as it single element
    * Manual creation of a multi-element list of a provided number of elements
    * Manual creation of a matrix of given number of rows and columns
    * Manual creation of a table from a matrix

* Reduction
    * Related to lists/vectors
        * Sort the elements of a list/vector
            * Using the natural order of its elements
            * Using a custom comparator, provided as a lambda expression  
        * [Cartesian product](https://en.wikipedia.org/wiki/Cartesian_product) of two or more lists/vectors
        * Cartesian exponentiation of a list/vector
        * [Dot product](https://en.wikipedia.org/wiki/Dot_product) of two or more lists/vectors
        * [Power set](https://en.wikipedia.org/wiki/Power_set) of two or more lists/vectors
    * Related to matrices
        * Matrix multiplication
        * Matrix transposition
        * Determinant of a matrix
        * Kronecker product of two or more matrices
        * Adjoint of a matrix
    * Programmatic creation of list/vactors/matrices/tables
        * Creation of a list from a range e.g. 5..10











