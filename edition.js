/*
Fōrmulæ list package. Module for edition.
Copyright (C) 2015-2025 Laurence R. Ugalde

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

List.editionCreateList = function() {
	let s = "";
	do {
		s = prompt(List.messages.editionNumberElements, s);
	}
	while (s != null && (isNaN(parseFloat(s)) || !isFinite(s)));
	
	if (s == null) return;
	
	let newList = Formulae.createExpression("List.List");
	Formulae.sExpression.replaceBy(newList);

	for (let i = 0, n = parseInt(s); i < n; ++i) {
		if (i == 0) {
			newList.addChild(Formulae.sExpression);
		}
		else {
			newList.addChild(Formulae.sExpression.clone());
		}
	}
	
	Formulae.sHandler.prepareDisplay();
	Formulae.sHandler.display();
	Formulae.setSelected(Formulae.sHandler, newList, false);
}

List.editionCreateMatrix = function() {
	if (List.createMatrixForm === undefined) {
		let table;

		table = document.createElement("table");
		table.classList.add("bordered");
		table.innerHTML =
`
<tr>
<th colspan=2>Dimensions of matrix
<tr>
<td>${List.messages.editionNumberRows}
<td><input type="number" value="1" min="1" max="9999">
<tr>
<td>${List.messages.editionNumberColumns}
<td><input type="number" value="1" min="1" max="9999">
<tr>
<th colspan=2><button>Ok</button>

`;

		List.createMatrixForm = table;
	}

	let tableRows = List.createMatrixForm.rows;
	let rows = tableRows[1].cells[1].firstChild;
	let cols = tableRows[2].cells[1].firstChild;
	let ok   = tableRows[3].cells[0].firstChild;

	ok.onclick = () => {
		let R = parseInt(rows.value);
		if (isNaN(R) || R < 1) {
			alert(List.messages.editionInvalidRows);
			return;
		}

		let C = parseInt(cols.value);
		if (isNaN(C) || C < 1) {
			alert(List.messages.editionInvalidColumns);
			return;
		}
		
		Formulae.resetModal();
		
		let newList = Formulae.createExpression("List.List");
		Formulae.sExpression.replaceBy(newList);
		let subList;
		
		for (let r = 0; r < R; ++r) {
			subList = Formulae.createExpression("List.List");
			
			for (let c = 0; c < C; ++c) {
				subList.addChild(Formulae.sExpression.clone());
			}
			
			newList.addChild(subList);
		}
		
		Formulae.sHandler.prepareDisplay();
		Formulae.sHandler.display();
		Formulae.setSelected(Formulae.sHandler, newList, false);
	};
	
	Formulae.setModal(List.createMatrixForm);
}

List.editionInsertRow = function(after) {
	let row = Formulae.sExpression.parent;
	if (!(row instanceof Expression)) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	
	let r = row.index;
	
	let matrix = row.parent;
	if (!(matrix instanceof Expression)) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	let cols = Utils.isMatrix(matrix);
	if (cols < 0) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	
	let newRow = Formulae.createExpression("List.List");
	for (let i = 0; i < cols; ++i) newRow.addChild(Formulae.createExpression("Null"));
	
	matrix.addChildAt(after ? r + 1 : r, newRow);
	
	Formulae.sHandler.prepareDisplay();
	Formulae.sHandler.display();
	Formulae.setSelected(Formulae.sHandler, Formulae.sExpression, false);
};

List.editionDeleteRow = function(after) {
	let element = Formulae.sExpression;
	
	let row = Formulae.sExpression.parent;
	if (!(row instanceof Expression)) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	
	let c = element.index;
	let r = row.index;
	
	let matrix = row.parent;
	if (!(matrix instanceof Expression)) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	let cols = Utils.isMatrix(matrix);
	if (cols < 0) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	
	matrix.removeChildAt(r);
	
	Formulae.sHandler.prepareDisplay();
	Formulae.sHandler.display();
	
	if (matrix.children.length === 0) {
		Formulae.setSelected(Formulae.sHandler, matrix, false);
	}
	else if (r >= matrix.children.length) {
		Formulae.setSelected(Formulae.sHandler, matrix.children[r - 1].children[c], false);
	}
	else {
		Formulae.setSelected(Formulae.sHandler, matrix.children[r].children[c], false);
	}
};

List.editionInsertColumn = function(after) {
	let element = Formulae.sExpression;
	
	let row = element.parent;
	if (!(row instanceof Expression)) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	
	let c = element.index;
	
	let matrix = row.parent;
	if (!(matrix instanceof Expression)) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	let cols = Utils.isMatrix(matrix);
	if (cols < 0) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	
	let rows = matrix.children.length;
	
	for (let i = 0; i < rows; ++i) {
		matrix.children[i].addChildAt(after ? c + 1 : c, Formulae.createExpression("Null"));
	}
	
	Formulae.sHandler.prepareDisplay();
	Formulae.sHandler.display();
	Formulae.setSelected(Formulae.sHandler, Formulae.sExpression, false);
};

List.editionDeleteColumn = function(after) {
	let element = Formulae.sExpression;
	
	let row = Formulae.sExpression.parent;
	if (!(row instanceof Expression)) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	
	let c = element.index;
	let r = row.index;
	
	let matrix = row.parent;
	if (!(matrix instanceof Expression)) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	let cols = Utils.isMatrix(matrix);
	if (cols < 0) {
		alert(List.messages.msgNotMatrixElement);
		return;
	}
	
	let rows = matrix.children.length;

	for (let i = 0; i < rows; ++i) {
		matrix.children[i].removeChildAt(c);
	}
	
	Formulae.sHandler.prepareDisplay();
	Formulae.sHandler.display();
	
	if (matrix.children[0].children.length === 0) {
		Formulae.setSelected(Formulae.sHandler, matrix, false);
	}
	else if (c >= cols - 1) {
		Formulae.setSelected(Formulae.sHandler, matrix.children[r].children[c - 1], false);
	}
	else {
		Formulae.setSelected(Formulae.sHandler, matrix.children[r].children[c], false);
	}
};

List.setEditions = function() {
	Formulae.addEdition(this.messages.pathList, null, this.messages.leafList, () => Expression.wrapperEdition("List.List"));
	Formulae.addEdition(this.messages.pathList, null, "Table", () => Expression.wrapperEdition("List.Table"));
	Formulae.addEdition(this.messages.pathList, null, "Undecorated table", () => Expression.wrapperEdition("List.UndecoratedTable"));
	
	Formulae.addEdition(this.messages.pathList, "packages/org.formulae.list/img/vector.png", null, () => List.editionCreateList());
	Formulae.addEdition(this.messages.pathList, null, "From range", () => Expression.binaryEdition ("List.FromRange", false));
	
	Formulae.addEdition(this.messages.pathCreateList, "packages/org.formulae.list/img/createlist4.png", null, () => Expression.multipleEdition("List.CreateList", 4, 0));
	Formulae.addEdition(this.messages.pathCreateList, "packages/org.formulae.list/img/createlist5.png", null, () => Expression.multipleEdition("List.CreateList", 5, 0));
	Formulae.addEdition(this.messages.pathCreateList, "packages/org.formulae.list/img/createlist3.png", null, () => Expression.multipleEdition("List.CreateList", 3, 0));
	Formulae.addEdition(this.messages.pathCreateList, "packages/org.formulae.list/img/createlist2.png", null, () => Expression.multipleEdition("List.CreateList", 2, 0));
	
	Formulae.addEdition(this.messages.pathCreateTable, "packages/org.formulae.list/img/createtable4.png", null, () => Expression.multipleEdition("List.CreateTable", 4, 0));
	Formulae.addEdition(this.messages.pathCreateTable, "packages/org.formulae.list/img/createtable5.png", null, () => Expression.multipleEdition("List.CreateTable", 5, 0));
	Formulae.addEdition(this.messages.pathCreateTable, "packages/org.formulae.list/img/createtable3.png", null, () => Expression.multipleEdition("List.CreateTable", 3, 0));
	
	Formulae.addEdition(this.messages.pathCreateTable, "packages/org.formulae.list/img/createcrossedtable.png", null, () => Expression.multipleEdition("List.CreateCrossedTable", 3, 0));
	
	Formulae.addEdition(this.messages.pathList, null, this.messages.leafSort,     () => Expression.wrapperEdition("List.Sort"));
	Formulae.addEdition(this.messages.pathList, null, this.messages.leafToMatrix, () => Expression.multipleEdition("List.ToMatrix", 2, 0));
	
	Formulae.addEdition(this.messages.pathList, null, this.messages.leafCartesianProduct,        () => Expression.binaryEdition ("List.CartesianProduct",        false));
	Formulae.addEdition(this.messages.pathList, null, this.messages.leafDotProduct,              () => Expression.binaryEdition ("List.DotProduct",              false));
	Formulae.addEdition(this.messages.pathList, null, this.messages.leafOuterProduct,            () => Expression.binaryEdition ("List.OuterProduct",            false));
	Formulae.addEdition(this.messages.pathList, null, this.messages.leafPowerSet,                () => Expression.wrapperEdition("List.PowerSet"                      ));
	Formulae.addEdition(this.messages.pathList, null, this.messages.leafCartesianExponentiation, () => Expression.binaryEdition ("List.CartesianExponentiation", false));
	
	Formulae.addEdition(this.messages.pathMatrix, "packages/org.formulae.list/img/matrix.png",               this.messages.leafCreateMatrix,       () => List.editionCreateMatrix());
	Formulae.addEdition(this.messages.pathMatrix, "packages/org.formulae.list/img/insert_row_below.png",     this.messages.leafInsertRowBelow,     () => List.editionInsertRow(true));
	Formulae.addEdition(this.messages.pathMatrix, "packages/org.formulae.list/img/insert_row_above.png",     this.messages.leafInsertRowAbove,     () => List.editionInsertRow(false));
	Formulae.addEdition(this.messages.pathMatrix, "packages/org.formulae.list/img/delete_row.png",           this.messages.leafDeleteRow,          () => List.editionDeleteRow());
	Formulae.addEdition(this.messages.pathMatrix, "packages/org.formulae.list/img/insert_column_after.png",  this.messages.leafInsertColumnAfter,  () => List.editionInsertColumn(true));
	Formulae.addEdition(this.messages.pathMatrix, "packages/org.formulae.list/img/insert_column_before.png", this.messages.leafInsertColumnBefore, () => List.editionInsertColumn(false));
	Formulae.addEdition(this.messages.pathMatrix, "packages/org.formulae.list/img/delete_column.png",        this.messages.leafDeleteColumn,       () => List.editionDeleteColumn());
	
	Formulae.addEdition(this.messages.pathMatrix, null, this.messages.leafTranspose,        () => Expression.wrapperEdition("Math.Matrix.Transpose"              ));
	Formulae.addEdition(this.messages.pathMatrix, null, this.messages.leafDeterminant,      () => Expression.wrapperEdition("Math.Matrix.Determinant"            ));
	Formulae.addEdition(this.messages.pathMatrix, null, this.messages.leafKroneckerProduct, () => Expression.binaryEdition ("Math.Matrix.KroneckerProduct", false));
	Formulae.addEdition(this.messages.pathMatrix, null, this.messages.leafAdjoint,          () => Expression.wrapperEdition("Math.Matrix.Adjoint"                ));
	
	Formulae.addEdition(this.messages.pathTable, null, this.messages.leafRangeLookup, () => Expression.binaryEdition ("List.Table.RangeLookup",       false));
	Formulae.addEdition(this.messages.pathTable, null, this.messages.leafExactLookup, () => Expression.binaryEdition ("List.Table.ExactLookup",       false));
};
