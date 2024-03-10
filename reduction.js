/*
Fōrmulæ list package. Module for reduction.
Copyright (C) 2015-2023 Laurence R. Ugalde

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

'use strict';

export class List extends Formulae.Package {}

List.fromRange = async (range, session) => {
	let left = CanonicalArithmetic.getBigInt(range.children[0]);
	if (left === undefined) {
		ReductionManager.setInError(range.children[0], "Expression must be an integer number");
		throw new ReductionError();
	}
	
	let right = CanonicalArithmetic.getBigInt(range.children[1]);
	if (right === undefined) {
		ReductionManager.setInError(range.children[1], "Expression must be an integer number");
		throw new ReductionError();
	}
	
	let result = Formulae.createExpression("List.List");
	
	let i = left;
	let step =left <= right ? 1n : -1n;
	
	while (true) {
		result.addChild(
			CanonicalArithmetic.canonical2InternalNumber(
				new CanonicalArithmetic.Integer(BigInt(i))
			)
		);
		if (i === right) break;
		i += step;
	}
	
	range.replaceBy(result);
	return true;
};

List.table = async (table, session) => {
	if (table.children.length != 2) return false;
	
	if (table.children[1].getTag() !== "List.List") return false;
	
	let cols = Utils.isMatrix(table.children[0]);
	if (cols == 0) return false;
	
	if (cols !== table.children[1].children.length) return false;
	
	let copy = table.children[0].clone();
	copy.addChildAt(0, table.children[1].clone());
	table.setChild(0, copy);
	table.removeChildAt(1);
	return true;
};

List.createList = async (createList, session) => {
	if (createList.children.length == 3) return false;
	
	let n = createList.children.length;
	let result;
	
	if (n == 2) {
		let arg = createList.children[0];
		let _N = await session.reduceAndGet(createList.children[1], 1);
		
		let N = CanonicalArithmetic.getInteger(_N);
		if (N === undefined) return false;
		
		result = Formulae.createExpression("List.List");
		
		for (let i = 0; i < N; ++i) {
			result.addChild(arg.clone());
		}
		
		createList.replaceBy(result);
		await session.reduce(result);
		
		//session.log("List created");
	}
	else {
		// symbol
		let symbol = createList.children[1];
		if (symbol.getTag() !== "Symbolic.Symbol") {
			return false;
		}
		
		for (let i = 2; i < n; ++i) {
			await session.reduce(createList.children[i]);
		}
		
		// from
		let from;
		if (n >= 4) {
			if (!createList.children[2].isInternalNumber()) return false;
			from = createList.children[2].get("Value");
		}
		else {
			from = new CanonicalArithmetic.Integer(1n);
		}
		
		// to
		if (!createList.children[n == 3 ? 2 : 3].isInternalNumber()) return false;
		let to = createList.children[n == 3 ? 2 : 3].get("Value");
		
		// step
		let step;
		if (n == 5) {
			if (!createList.children[4].isInternalNumber()) return false;
			step = createList.children[4].get("Value");
		}
		else {
			step = new CanonicalArithmetic.Integer(1n);
		}
		if (step.isZero()) return false;
		
		// sign
		let negative = step.isNegative();
		
		result = Formulae.createExpression("List.List");
		
		//////////////////////////////////////
		
		result.createScope();
		let scopeEntry = new ScopeEntry();
		result.putIntoScope(symbol.get("Name"), scopeEntry, false);
		
		//createList.replaceBy(result);
		//session.log("List created");
		
		let arg = createList.children[0];
		let clone;
		
		let isTable = createList.getTag() === "List.CreateTable";
		let hasHeaders = isTable && Utils.isMatrix(arg) > 0;
		
		if (isTable) {
			let table = Formulae.createExpression("List.Table");
			table.addChild(result);
			createList.replaceBy(table);
		}
		else {
			createList.replaceBy(result);
		}
		
		if (isTable) { // header
			if (hasHeaders) {
				result.addChild(arg.children[0].clone());
			}
			else {
				result.addChild(arg.clone());
			}
		}
		
		filling: while (true) {
			if (negative) {
				if (from.comparison(to, session) < 0) {
					break filling;
				}
			}
			else {
				if (from.comparison(to, session) > 0) {
					break filling;
				}
			}
			scopeEntry.setValue(CanonicalArithmetic.canonical2InternalNumber(from));
			
			if (hasHeaders) {
				result.addChild(clone = arg.children[1].clone());
			}
			else {
				result.addChild(clone = arg.clone());
			}
			//result.addChild(clone = arg.clone());
			//session.log("Element created");
			
			await session.reduce(clone);
			
			from = from.addition(step, session);
		}
		
		result.removeScope();
	}
	
	return true;
};

List.createListList = async (createList, session) => {
	if (createList.children.length != 3) return false;
	
	// the symbol, or list of symbols
	let numberOfSymbols;
	let symbols;
	{
		let spec = createList.children[1];
		switch (spec.getTag()) {
			case "Symbolic.Symbol":
				numberOfSymbols = 1;
				symbols = [ spec.get("Name") ];
				break;
			
			case "List.List":
				numberOfSymbols = spec.children.length;
				symbols = Array(numberOfSymbols);
				for (let s = 0; s < numberOfSymbols; ++s) {
					if (spec.children[s].getTag() !== "Symbolic.Symbol") return false;
					symbols[s] = spec.children[s].get("Name");
				}
				break;
			
			default: return false;
		}
	}
	
	// the list to iterate over
	let list = await session.reduceAndGet(createList.children[2], 2);
	if (list.getTag() !== "List.List") {
		return false;
	}
	
	// the argument
	let arg = createList.children[0];
	
	// the resulting list
	let result = Formulae.createExpression("List.List");
	
	let isTable = createList.getTag() === "List.CreateTable";
	let hasHeaders = isTable && Utils.isMatrix(arg) > 0;
	
	if (isTable) {
		let table = Formulae.createExpression("List.Table");
		table.addChild(result);
		createList.replaceBy(table);
	}
	else {
		createList.replaceBy(result);
	}
	
	// the first element of the resulting list, the header (if it is a table)
	if (isTable) {
		if (hasHeaders) {
			result.addChild(arg.children[0].clone());
		}
		else {
			result.addChild(arg.clone());
		}
	}
	
	//createList.replaceBy(result);
	//session.log("List created");
	
	result.createScope();
	
	let scopeEntries = Array(numberOfSymbols);
	for (let s = 0; s < numberOfSymbols; ++s) {
		scopeEntries[s] = new ScopeEntry();
		result.putIntoScope(symbols[s], scopeEntries[s], false);
	}
	
	// filling
	for (let e = 0, E = list.children.length; e < E; ++e) {
		if (numberOfSymbols == 1) {
			scopeEntries[0].setValue(list.children[e].clone());
		}
		else {
			for (let s = 0; s < numberOfSymbols; ++s) {
				scopeEntries[s].setValue(list.children[e].children[s].clone());
			}
		}
		
		if (isTable && hasHeaders) {
			result.addChild(arg.children[1].clone());
		}
		else {
			result.addChild(arg.clone());
		}
		
		//result.unlockScope();
		await session.reduce(result.children[result.children.length - 1]);
		//result.lockScope();
	}
	
	result.removeScope();
	
	return true;
};

List.createCrossedTable = async (createCrossedTable, session) => {
	// the two symbols
	let symbolList = createCrossedTable.children[1];
	let symbolName1, symbolName2;
	{
		if (symbolList.getTag() !== "List.List") return false;
		if (symbolList.children.length !== 2) return false;
		let symbol1, symbol2;
		if ((symbol1 = symbolList.children[0]).getTag() !== "Symbolic.Symbol") return false;
		if ((symbol2 = symbolList.children[1]).getTag() !== "Symbolic.Symbol") return false;
		symbolName1 = symbol1.get("Name");
		symbolName2 = symbol2.get("Name");
		if (symbolName1 === symbolName2) return false;
	}
	
	// the two lists to iterate over
	let list1, list2;
	lists: {
		let lists = await session.reduceAndGet(createCrossedTable.children[2], 2);
		if (lists.getTag() !== "List.List") return false;
		
		if (lists.children.length == 1) {
			if ((list1 = list2 = lists.children[0]).getTag() !== "List.List" || list1.children.length == 0) return false;
			break lists;
		}
		
		if (lists.children.length == 2) {
			if ((list1 = lists.children[0]).getTag() !== "List.List" || list1.children.length == 0) return false;
			if ((list2 = lists.children[1]).getTag() !== "List.List" || list2.children.length == 0) return false;
			break lists;
		}
		
		return false;
	}
	
	// the argument
	let arg = createCrossedTable.children[0];
	
	// the resulting matrix
	let matrix = Formulae.createExpression("List.List");
	let result = Formulae.createExpression("List.Table");
	result.addChild(matrix);
	createCrossedTable.replaceBy(result);

	// creating the scope
	result.createScope();
	
	let entry1 = new ScopeEntry();
	let entry2 = new ScopeEntry();
	
	matrix.putIntoScope(symbolName1, entry1, false);
	matrix.putIntoScope(symbolName2, entry2, false);
	
	// filling
	let x, X = list2.children.length;
	let y, Y = list1.children.length;
	let row;
	let a;
	
	// first row
	row = Formulae.createExpression("List.List");
	row.addChild(symbolList.clone());
	for (x = 0; x < X; ++x) {
		row.addChild(list2.children[x].clone())
	}
	matrix.addChild(row);
	
	// rows
	for (y = 0; y < Y; ++y) {
		row = Formulae.createExpression("List.List");
		matrix.addChild(row);
		
		row.addChild(list1.children[y].clone());
		entry1.setValue(list1.children[y].clone());
		
		for (x = 0; x < X; ++x) {
			//console.log(y + " - " + x);
			entry2.setValue(list2.children[x].clone());
			
			row.addChild(a = arg.clone());
			await session.reduce(a);
		}
	}
	
	result.removeScope();
	return true;
};

List.negativeList = async (negativeList, session) => {
	let list = negativeList.children[0];
	if (list.getTag() !== "List.List") return false;
	
	let i, n = list.children.length;
	let negative;
	
	for (i = 0; i < n; ++i) {
		negative = Formulae.createExpression("Math.Arithmetic.Negative");
		negative.addChild(list.children[i]);
		list.setChild(i, negative);
	}
	
	negativeList.replaceBy(list);
	//session.log("Negative of a list");
	
	for (i = 0; i < n; ++i) {
		await session.reduce(list.children[i]);
	}
	
	return true;
};

List.additionLists = async (additionList, session) => {
	let sizePivot;
	let pivot;
	let updated = false;
	
	outer: for (let o = 0, O = additionList.children.length - 1; o < O; ++o) {
		pivot = additionList.children[o];
		if (pivot.getTag() !== "List.List") continue outer;
		
		if ((sizePivot = pivot.children.length) > 0) { // a pivot
			let test;
			let found = false;
			
			inner: for (let i = o + 1; i <= O; ++i) {
				test = additionList.children[i];
				if (test.getTag() !== "List.List") continue inner;
				if (sizePivot == test.children.length) { // hit
					updated = found = true;
					let expr;
					
					for (let e = 0; e < sizePivot; ++e) {
						expr = pivot.children[e];
						
						if (expr.getTag() !== "Math.Arithmetic.Addition") {
							let sum = Formulae.createExpression("Math.Arithmetic.Addition");
							expr.replaceBy(sum);
							sum.addChild(expr);
							expr = sum;
						}
						
						expr.addChild(test.children[e]);
					}
					
					additionList.removeChildAt(i);
					--i;
					--O;
				}
			}
			
			if (found) {
				//session.log("Addition of same size lists");
				
				for (let i = 0; i < sizePivot; ++i) {
					await session.reduce(pivot.children[i]);
				}
			}
		}
	}
	
	if (updated) {
		if (additionList.children.length == 1) {
			additionList.replaceBy(additionList.children[0]);
		}
		
		return true;
	}
	
	return false;
};

List.multiplicationScalarList = async (multiplication, session) => {
	if (multiplication.children.length != 2) return false;
	
	let list = multiplication.children[1];
	if (list.getTag() !== "List.List") return false;
	
	let scalar = multiplication.children[0];
	if (!CanonicalArithmetic.isExpressionCanonicalNumeric(scalar)) return false;
	
	let i, n = list.children.length;
	
	let mult;
	for (i = 0; i < n; ++i) {
		mult = Formulae.createExpression("Math.Arithmetic.Multiplication");
		mult.addChild(scalar.clone());
		mult.addChild(list.children[i]);
		list.setChild(i, mult);
	}
	
	multiplication.replaceBy(list);
	//session.log("Multiplication of a sclar and a list");
	
	for (i = 0; i < n; ++i) {
		await session.reduce(list.children[i]);
	}
	
	return true;
};

List.matrixMultiplication = async (multiplication, session) => {
	let left;
	let colsLeft;
	let updated = false;
	
	for (
		let i = 0, n_1 = multiplication.children.length - 1;
		i < n_1;
		++i
	) {
		left = multiplication.children[i];
		
		if ((colsLeft = Utils.isMatrix(left)) > 0) {
			let right = multiplication.children[i + 1];
			let colsRight = Utils.isMatrix(right);
			
			if (colsRight > 0) {
				let rowsRight = right.children.length;
				
				if (colsLeft == rowsRight) {
					updated = true;
					let rowsLeft = left.children.length;
					let result = Formulae.createExpression("List.List");
					let row, target;
					let r, c, x;
					let mult;
					
					for (r = 0; r < rowsLeft; ++r) {
						result.addChild(row = Formulae.createExpression("List.List"));
						
						for (c = 0; c < colsRight; ++c) {
							if (colsLeft == 1) {
								target = row;
							}
							else {
								row.addChild(
									target = Formulae.createExpression("Math.Arithmetic.Addition")
								);
							}
							
							for (x = 0; x < colsLeft; ++x) {
								mult = Formulae.createExpression("Math.Arithmetic.Multiplication");
								mult.addChild(left.children[r].children[x].clone());
								mult.addChild(right.children[x].children[c].clone());
								target.addChild(mult);
							}
						}
					}
					
					left.replaceBy(result);
					multiplication.removeChildAt(i + 1);
					
					//session.log("Multiplication of matrices");
					
					for (r = 0; r < rowsLeft; ++r) {
						for (c = 0; c < colsRight; ++c) {
							await session.reduce(result.children[r].children[c]);
						}
					}
					
					--i;
					--n_1;
				}
			}
		}
	}
	
	if (updated) {
		if (multiplication.children.length == 1) {
			multiplication.replaceBy(multiplication.children[0]);
		}
		
		return true;
	}
	
	return false;
};

List.matrixExponentiation = async (exponentiation, session) => {
	let matrix = exponentiation.clone().children[0];
	
	let cols = Utils.isMatrix(matrix);
	if (cols <= 0) return false;
	
	if (matrix.children.length != cols) return false;
	
	let exponent = exponentiation.children[1];
	
	let n = CanonicalArithmetic.getInteger(exponent);
	if (n === undefined) return false;
	
	////////////////////////
	
	if (n == 1) {
		exponentiation.replaceBy(matrix);
		//session.log("Matrix exponentiation");
		return true;
	}
	
	let result = Formulae.createExpression("Math.Arithmetic.Multiplication");
	for (let i = 0; i < n; ++i) {
		result.addChild(matrix.clone());
	}
	
	exponentiation.replaceBy(result);
	//session.log("Matrix exponentiation");
	
	await session.reduce(result);
	return true;
};

List.matrixTranspose = async (transpose, session) => {
	let matrix = transpose.children[0];
	let cols = Utils.isMatrix(matrix);
	if (cols > 0) {
		let r, c, rows = matrix.children.length;
		let row, result = Formulae.createExpression("List.List");
		
		for (r = 0; r < cols; ++r) {
			result.addChild(row = Formulae.createExpression("List.List"));
			for (c = 0; c < rows; ++c) {
				row.addChild(matrix.children[c].children[r].clone());
			}
		}
		
		transpose.replaceBy(result);
		//session.log("Transpose of a matrix");
		return true;
	}
	
	return false;
};

List.matrixDeterminant = async (determinant, session) => {
	let matrix = determinant.children[0];
	let size = Utils.isMatrix(matrix);
	
	// matrix ?
	if (size <= 0) return false;
	
	// square ?
	if (matrix.children.length != size) return false;
	
	// 1 x 1
	if (size == 1) {
		determinant.replaceBy(matrix.children[0].children[0]);
		//session.log("Determinant of a matrix");
		return true;
	}
	
	// 2 x 2
	if (size == 2) {
		let mult1 = Formulae.createExpression("Math.Arithmetic.Multiplication");
		mult1.addChild(matrix.children[0].children[0]);
		mult1.addChild(matrix.children[1].children[1]);
		
		let mult2 = Formulae.createExpression("Math.Arithmetic.Multiplication");
		mult2.addChild(matrix.children[0].children[1]);
		mult2.addChild(matrix.children[1].children[0]);
		
		let neg = Formulae.createExpression("Math.Arithmetic.Negative");
		neg.addChild(mult2);
		
		let result = Formulae.createExpression("Math.Arithmetic.Addition");
		result.addChild(mult1);
		result.addChild(neg);
		
		determinant.replaceBy(result);
		//session.log("Determinant of a matrix");
		await session.reduce(result);
		return true;
	}
	
	// 3 x 3 or greater
	let addend, multiplication, det, minor, row;
	let addition =
		Formulae.createExpression("Math.Arithmetic.Addition")
	;
	let r, c, size_1 = size - 1;
	
	for (let part = 0; part < size; ++part) {
		multiplication = Formulae.createExpression(
			"Math.Arithmetic.Multiplication"
		);
		
		det = Formulae.createExpression(
			"Math.Matrix.Determinant"
		);
		det.addChild(
			minor = Formulae.createExpression("List.List")
		);
		
		multiplication.addChild(matrix.children[0].children[part].clone());
		multiplication.addChild(det);
		
		if (part % 2 != 0) {
			addend = Formulae.createExpression(
				"Math.Arithmetic.Negative"
			);
			addend.addChild(multiplication);
		}
		else {
			addend = multiplication;
		}
		
		for (r = 0; r < size_1; ++r) {
			minor.addChild(row = Formulae.createExpression("List.List"));
			for (c = 0; c < size_1; ++c) {
				row.addChild(matrix.children[r + 1].children[c >= part ? c + 1 : c].clone());
			}
		}
		
		addition.addChild(addend);
	}
	
	determinant.replaceBy(addition);
	//session.log("Determinant of a matrix");
	await session.reduce(addition);
	return true;
};

List.rangeLookup = async (lookup, session) => {
	let table = lookup.children[0];
	
	// it is not a table, or it is a table with less than 2 columns
	if (Utils.isMatrix(table) < 2) {
		return false;
	}
	
	let value = lookup.children[1];
	let pivot;
	let compare;
	let result;
	let row;
	
	rows: for (let r = 0, R = table.children.length; r < R; ++r) {
		row = table.children[r];
		pivot = row.children[0];
		
		compare = Formulae.createExpression("Relation.Compare");
		compare.addChild(value.clone());
		compare.addChild(pivot.clone());
		row.setChild(0, compare);
		//session.log("conversion to compare");
		
		// comparing
		result = await session.reduceAndGet(compare, 0);
		
		// restoring
		row.setChild(0, pivot);
		//session.log("restoring");
		
		// there was no reduction
		if (result === compare) {
			return false;
		}
		
		// a reduction was performed
		if (result.getTag() === "Relation.Comparison.Greater") {
			if (r == R - 1) { // last row
				lookup.replaceBy(row);
				//session.log("Lookup succeded");
				return true;
			}
			
			continue rows;
		}
		
		if (result.getTag() === "Relation.Comparison.Less") {
			if (r == 0) {
				return false;
			}
			
			lookup.replaceBy(table.children[r - 1]);
			//session.log("Lookup succeded");
			return true;
		}
		
		if (result.getTag() === "Relation.Comparison.Equals") {
			lookup.replaceBy(row);
			//session.log("Lookup succeded");
			return true;
		}
	}
	
	return false;
};

List.exactLookupReducer = async (lookup, session) => {
	let table = lookup.children[0];
	let value = lookup.children[1];
	
	if (Utils.isMatrix(table) < 2) {
		return false;
	}
	
	let compare;
	let result;
	let pivot;
	let row;
	
	for (let r = 0, R = table.children.length; r < R; ++r) {
		row = table.children[r];
		pivot = row.children[0];
		
		compare = Formulae.createExpression("Relation.Compare");
		compare.addChild(value.clone());
		compare.addChild(pivot.clone());
		row.setChild(0, compare);
		//session.log("conversion to compare");
		
		// comparing
		result = await session.reduceAndGet(compare, 0);
		
		// restoring
		row.setChild(0, pivot);
		//session.log("restoring");
		
		if (result.getTag() === "Relation.Comparison.Equals") {
			lookup.replaceBy(row);
			//session.log("Lookup succeded");
			return true;
		}
	}
	
	return false;
};

List.cartesianProduct = async (expr, session) => {
	let i, n = expr.children.length;
	
	for (i = 0; i < n; ++i) {
		if (expr.children[i].getTag() !== "List.List") {
			return false;
		}
	}
	
	let indices = Array(n).fill(0);
	let max = Array(n);
	
	let result = Formulae.createExpression("List.List");
	
	for (i = 0; i < n; ++i) {
		if ((max[i] = expr.children[i].children.length) == 0) {
			expr.replaceBy(result);
			//session.log("cartesian product");
			return true;
		}
	}
	
	let row = null;
	let m;
	
	product: while (true) {
		row = Formulae.createExpression("List.List");
		for (i = 0; i < n; ++i) {
			row.addChild(expr.children[i].children[indices[i]].clone());
		}
		result.addChild(row);
		
		for (i = 0; i < n; ++i) {
			m = n - i - 1;
			
			++indices[m];
			if (indices[m] == max[m]) {
				if (m == 0) {
					break product;
				}
				indices[m] = 0;
			}
			else {
				break;
			}
		}
	}
	
	expr.replaceBy(result);
	//session.log("cartesian product");
	return true;
};

List.cartesianExponentiation = async (expr, session) => {
	if (expr.children[0].getTag() !== "List.List") {
		return false;
	}
	
	let pow = CanonicalArithmetic.getInteger(expr.children[1]);
	if (pow == null) {
		return false;
	}
	
	let list = expr.children[0];
	
	if (pow < 0) {
		ReductionManager.setInError(expr.children[1], "Expression must be a non-negative integer number");
		throw new ReductionError();
	}
	
	if (pow == 0) {
		let outerList = Formulae.createExpression("List.List");
		outerList.addChild(Formulae.createExpression("List.List"));
		expr.replaceBy(outerList);
		//session.log("cartesian exponentiation");
		return true;
	}
	
	else { // pos > 0
		let product = Formulae.createExpression("List.CartesianProduct");
		for (let i = 0; i < pow; ++i) {
			product.addChild(list.clone());
		}
		expr.replaceBy(product);
		//session.log("cartesian exponentiation");
		await session.reduce(product);
		return true;
	}
};

List.kroneckerProduct = async (kroneckerProduct, session) => {
	let m1, m2;
	let result, row;
	let r1, c1, r2, c2;
	let C1, R1, C2, R2;
	let mult;
	
	factors: while (true) {
		m1 = kroneckerProduct.children[0];
		C1 = Utils.isMatrix(m1);
		if (C1 < 0) return false;
		R1 = m1.children.length;
		
		m2 = kroneckerProduct.children[1];
		C2 = Utils.isMatrix(m2);
		if (C2 < 0) return false;
		R2 = m2.children.length;
		
		result = Formulae.createExpression("List.List");
		
		for (r1 = 0; r1 < R1; ++r1) {
			for (r2 = 0; r2 < R2; ++r2) {
				row = Formulae.createExpression("List.List");
				
				for (c1 = 0; c1 < C1; ++c1) {
					for (c2 = 0; c2 < C2; ++c2) {
						row.addChild(
							mult = Formulae.createExpression("Math.Arithmetic.Multiplication")
						);
						mult.addChild(m1.children[r1].children[c1].clone());
						mult.addChild(m2.children[r2].children[c2].clone());
					}
				}
				
				result.addChild(row);
			}
		}
		
		if (kroneckerProduct.children.length == 2) {
			break factors;
		}
		else {
			m1.replaceBy(result);
			kroneckerProduct.removeChildAt(1);
			//session.log("Kronecker product");
		}
	}
	
	kroneckerProduct.replaceBy(result);
	//session.log("Kronecker product");
	await session.reduce(result);
	return true;
};

List.dotProduct = async (dotProduct, session) => {
	let f1 = dotProduct.children[0];
	if (f1.getTag() !== "List.List") return false;
	
	let f2 = dotProduct.children[1];
	if (f2.getTag() !== "List.List") return false;
	
	if (f1.children.length != f2.children.length) return false;
	
	let result;
	
	switch (f1.children.length) {
		case 0:
			dotProduct.replaceBy(
				CanonicalArithmetic.canonical2InternalNumber(
					new CanonicalArithmetic.Integer(0n)
				)
			);
			break;
		
		case 1:
			result = Formulae.createExpression("Math.Arithmetic.Multiplication");
			result.addChild(f1.children[0].clone()),
			result.addChild(f2.children[0].clone())
			
			dotProduct.replaceBy(result);
			await session.reduce(result);
			break;
		
		default:
			result = Formulae.createExpression("Math.Arithmetic.Addition");
			let mult;
			for (let i = 0, n = f1.children.length; i < n; ++i) {
				result.addChild(
					mult = Formulae.createExpression(
						"Math.Arithmetic.Multiplication"
					)
				);
				mult.addChild(f1.children[i].clone());
				mult.addChild(f2.children[i].clone());
			}
			dotProduct.replaceBy(result);
			await session.reduce(result);
			break;
	}
	
	//session.log("Dot product");
	return true;
};

List.outerProduct = async (outerProduct, session) => {
	let list1 = outerProduct.children[0];
	if (list1.getTag() !== "List.List") return false;
	
	let list2 = outerProduct.children[1];
	if (list2.getTag() !== "List.List") return false;
	
	let result1 = Formulae.createExpression("List.List"), result2;
	
	let i, n = list1.children.length, j, m = list2.children.length;
	
	for (i = 0; i < n; ++i) {
		result2 = Formulae.createExpression("List.List");
		let mult;
		for (j = 0; j < m; ++j) {
			result2.addChild(
				mult = Formulae.createExpression("Math.Arithmetic.Multiplication")
			);
			mult.addChild(list1.children[i].clone());
			mult.addChild(list2.children[j].clone());
		}
		result1.addChild(result2);
	}
	
	outerProduct.replaceBy(result1);
	//session.log("Outer product");
	await session.reduce(result1);
	return true;
};

List.powerSet = async (powerSet, session) => {
	let list = powerSet.children[0];
	if (list.getTag() !== "List.List") {
		ReductionManager.setInError(list, "Expression must be a list");
		throw new ReductionError();
	}
	
	let result = Formulae.createExpression("List.List");
	let size = list.children.length;
	let pos;
	let subList;
	
	for (let n = 0, N = Math.pow(2, size); n < N; ++n) {
		subList = Formulae.createExpression("List.List");
		for (pos = 0; pos < size; ++pos) {
			if ((n & (1 << pos)) == 0) {
				subList.addChild(list.children[pos].clone());
			}
		}
		result.addChild(subList);
	}
	
	powerSet.replaceBy(result);
	//session.log("Powerset");
	return true;
};

List.adjoint = async (adjoint, session) => {
	let matrix = adjoint.children[0];
	let cols = Utils.isMatrix(matrix);
	if (cols > 0) {
		let r, c, rows = matrix.children.length;
		let row, result = Formulae.createExpression("List.List");
		let conjugate;
		
		for (r = 0; r < cols; ++r) {
			result.addChild(row = Formulae.createExpression("List.List"));
			for (c = 0; c < rows; ++c) {
				row.addChild(
					conjugate = Formulae.createExpression("Math.Complex.Conjugate")
				);
				conjugate.addChild(matrix.children[c].children[r].clone());
			}
		}
		
		adjoint.replaceBy(result);
		//session.log("Adjoint of a matrix");
		
		for (r = 0; r < cols; ++r) {
			row = result.children[r];
			for (c = 0; c < rows; ++c) {
				await session.reduce(row.children[c]);
			}
		}
		
		return true;
	}
	
	return false;
};

// https://gist.github.com/kimamula/fa34190db624239111bbe0deba72a6ab

async function getPivot(x, y, z, compare) {
	if (await compare(x, y) < 0) {
		if (await compare(y, z) < 0) {
			return y;
		} else if (await compare(z, x) < 0) {
			return x;
		} else {
			return z;
		}
	} else if (await compare(y, z) > 0) {
		return y;
	} else if (await compare(z, x) > 0) {
		return x;
	} else {
		return z;
	}
}

async function quickSort(arr, compare, left = 0, right = arr.length - 1) {
	if (left < right) {
		let i = left, j = right, tmp;
		const pivot = await getPivot(arr[i], arr[i + Math.floor((j - i) / 2)], arr[j], compare);
		while (true) {
			while (await compare(arr[i],  pivot) < 0) {
				i++;
			}
			while (await compare(pivot, arr[j]) < 0) {
				j--;
			}
			if (i >= j) {
				break;
			}
			tmp = arr[i];
			arr[i] = arr[j];
			arr[j] = tmp;
		
			i++;
			j--;
		}
		await quickSort(arr, compare, left, i - 1);
		await quickSort(arr, compare, j + 1, right);
	}
	return arr;
}

List.sort = async (sort, session) => {
	let listExpression = sort.children[0];
	if (listExpression.getTag() !== "List.List") return false;
	
	let lambda;
	
	if (sort.children.length >= 2) {
		lambda = sort.children[1];
	}
	else { // default comparator
		let s1 = Formulae.createExpression("Symbolic.Symbol");
		s1.set("Name", "___s1");
		
		let s2 = Formulae.createExpression("Symbolic.Symbol");
		s2.set("Name", "___s2");
		
		let parameters = Formulae.createExpression("List.List");
		parameters.addChild(s1);
		parameters.addChild(s2);
		
		let compare = Formulae.createExpression("Relation.Compare");
		compare.addChild(s1.clone()); // clone ???
		compare.addChild(s2.clone());
		
		lambda = Formulae.createExpression("Symbolic.Lambda");
		lambda.addChild(parameters);
		lambda.addChild(compare);
	}
	
	let application = Formulae.createExpression("Symbolic.LambdaApplication");
	application.addChild(lambda);
	application.addChild(Formulae.createExpression("List.List")); // empty
	
	let handler = new ExpressionHandler();
	
	let comparator = async function(e1, e2) {
	//let comparator = async (e1, e2) => {
		let app = application.clone();
		let args = app.children[1]; // values of lambda application
		args.addChild(e1.clone());
		args.addChild(e2.clone());
		
		handler.setExpression(app);
		
		try {
			//console.log(app);
			await session.reduce(app);
			let r = handler.expression;
			//console.log(r);
			
			switch (r.getTag()) {
				case "Relation.Comparison.Less"   : return -1;
				case "Relation.Comparison.Greater": return 1;
				default: return 0;
			}
		}
		catch (e) {
			console.log(e);
			return 0;
		}
	};
	
	let listSorted = await quickSort(listExpression.children, comparator);
	
	let result = Formulae.createExpression("List.List");
	for (let i = 0, n = listSorted.length; i < n; ++i) {
		result.addChild(listSorted[i]);
	}
	
	sort.replaceBy(result);
	return true;
};

List.setReducers = () => {
	ReductionManager.addReducer("List.Table", List.table, "List.table");
	
	ReductionManager.addReducer("List.FromRange", List.fromRange, "List.fromRange");
	
	ReductionManager.addReducer("List.CreateList",         List.createList,         "List.createList", { special: true });
	ReductionManager.addReducer("List.CreateList",         List.createListList,     "List.createListList", { special: true });
	ReductionManager.addReducer("List.CreateTable",        List.createList,         "List.createList", { special: true });
	ReductionManager.addReducer("List.CreateTable",        List.createListList,     "List.createListList", { special: true });
	ReductionManager.addReducer("List.CreateCrossedTable", List.createCrossedTable, "List.createCrossedTable", { special: true });
	
	ReductionManager.addReducer("Math.Arithmetic.Negative",       List.negativeList,             "List.negativeList");
	ReductionManager.addReducer("Math.Arithmetic.Addition",       List.additionLists,            "List.additionLists");
	ReductionManager.addReducer("Math.Arithmetic.Multiplication", List.multiplicationScalarList, "List.multiplicationScalarList");
	ReductionManager.addReducer("Math.Arithmetic.Multiplication", List.matrixMultiplication,     "List.matrixMultiplication");
	ReductionManager.addReducer("Math.Arithmetic.Exponentiation", List.matrixExponentiation,     "List.matrixExponentiation");
	ReductionManager.addReducer("Math.Matrix.Transpose",          List.matrixTranspose,          "List.matrixTranspose");
	ReductionManager.addReducer("Math.Matrix.Determinant",        List.matrixDeterminant,        "List.matrixDeterminant");
	ReductionManager.addReducer("List.Table.RangeLookup",         List.rangeLookup,              "List.rangeLookup");
	ReductionManager.addReducer("List.Table.ExactLookup",         List.exactLookupReducer,       "List.exactLookupReducer");
	ReductionManager.addReducer("List.CartesianProduct",          List.cartesianProduct,         "List.cartesianProduct");
	ReductionManager.addReducer("List.CartesianExponentiation",   List.cartesianExponentiation,  "List.cartesianExponentiation");
	ReductionManager.addReducer("Math.Matrix.KroneckerProduct",   List.kroneckerProduct,         "List.kroneckerProduct");
	ReductionManager.addReducer("List.DotProduct",                List.dotProduct,               "List.dotProduct");
	ReductionManager.addReducer("List.OuterProduct",              List.outerProduct,             "List.outerProduct");
	ReductionManager.addReducer("List.PowerSet",                  List.powerSet,                 "List.powerSet");
	ReductionManager.addReducer("Math.Matrix.Adjoint",            List.adjoint,                  "List.adjoint");
	ReductionManager.addReducer("List.Sort",                      List.sort,                     "List.sort");
};
