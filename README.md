# package-list-js

List (and matrix, tables) package for [Fōrmulæ](https://formulae.org) — the visual environment for **computing**, **composing**, and **conversing** with tree-structured expressions.

This repository contains the source code for the **list package**. It is intended to the computation on lists. Despite the name, it includes a lot of expressions related to vectors, matrices (because a matrix is a list of -same cardinallity- subslists), and tables.

> Part of the [formulae-org](https://github.com/formulae-org) organization: the [web application](https://github.com/formulae-org/formulae-js) plus one repository per package.

▶ **[Showcase](https://formulae.org/?script=showcases/List)** — worked examples of this package.

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
        * [Sort](https://en.wikipedia.org/wiki/Sorting) the elements of a list/vector
            * Using the natural order of its elements
            * Using a custom comparator, provided as a lambda expression  
        * [Cartesian product](https://en.wikipedia.org/wiki/Cartesian_product) of two or more lists/vectors
        * Cartesian exponentiation of a list/vector
        * [Dot product](https://en.wikipedia.org/wiki/Dot_product) of two or more lists/vectors
        * [Power set](https://en.wikipedia.org/wiki/Power_set) of two or more lists/vectors
    * Related to matrices
        * [Matrix multiplication](https://en.wikipedia.org/wiki/Matrix_multiplication)
        * [Transpose of a matrix](https://en.wikipedia.org/wiki/Transpose)
        * [Determinant of a matrix](https://en.wikipedia.org/wiki/Determinant)
        * [Kronecker product](https://en.wikipedia.org/wiki/Kronecker_product) of two or more matrices
        * [Conjugate transpose](https://en.wikipedia.org/wiki/Conjugate_transpose) of a matrix
    * Programmatic creation of list/vectors/matrices/tables
        * Creation of a list from a range e.g. 5..10











