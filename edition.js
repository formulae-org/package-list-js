/*
Fōrmulæ list package. Module for edition.
Copyright (C) 2015-2026 Laurence R. Ugalde

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
	
	Formulae.addEdition(this.messages.pathTable, null, this.messages.leafRangeLookup, () => Expression.binaryEdition ("List.Table.RangeLookup",       false));
	Formulae.addEdition(this.messages.pathTable, null, this.messages.leafExactLookup, () => Expression.binaryEdition ("List.Table.ExactLookup",       false));
};
