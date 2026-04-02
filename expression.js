/*
Fōrmulæ list package. Module for expression definition & visualization.
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

List.drawSquareBracket = function(context, x, y, height, opening) {
	context.beginPath();
	
	if (opening) {
		++x;
		context.moveTo(x + 4, y);
		context.lineTo(x - 1, y);
		
		context.moveTo(x, y - 1         );
		context.lineTo(x, y + height + 1);
		
		context.moveTo(x - 1, y + height);
		context.lineTo(x + 4, y + height);
	}
	else {
		--x;
		context.moveTo(x - 4, y);
		context.lineTo(x + 1, y);
		
		context.moveTo(x, y - 1         );
		context.lineTo(x, y + height + 1);
		
		context.moveTo(x + 1, y + height);
		context.lineTo(x - 4, y + height);
	}
	
	context.stroke();
}

/*
List.drawBrace = function(context, x, y, height, baseline, opening) {
	context.beginPath();
	
	if (opening) {
		context.moveTo (x + 4, y               ); //    .
		context.lineTo (x + 2, y + 2           ); //   /
		context.lineTo (x + 2, y + baseline - 2); //   |
		context.lineTo (x,     y + baseline    ); //  /
		context.lineTo (x + 2, y + baseline + 2); //  \
		context.lineTo (x + 2, y + height - 2  ); //   |
		context.lineTo (x + 4, y + height      ); //   \
	}
	else {
		context.moveTo (x - 4, y               ); // .
		context.lineTo (x - 2, y + 2           ); //  \
		context.lineTo (x - 2, y + baseline - 2); //  |
		context.lineTo (x,     y + baseline    ); //   \
		context.lineTo (x - 2, y + baseline + 2); //   /
		context.lineTo (x - 2, y + height - 2  ); //  |
		context.lineTo (x - 4, y + height      ); //  /
	}
	
	context.stroke();
}
*/

List.List = class extends Expression {
	getTag() { return "List.List"; }
	getName() { return List.messages.nameList; }
	canHaveChildren(count)  { return true; }

	prepareDisplay(context) {
		this.cols = Utils.isMatrix(this);

		if (this.cols <= 0) {
			this.prepareDisplayAsList(context, 6, 6);
		}
		else {
			this.prepareDisplayAsMatrix(context, 10, 5);
		}
	}

	display(context, x, y) {
		if (this.cols <= 0) {
			//List.drawBrace(context, x, y, this.height, this.horzBaseline, true);
			List.drawSquareBracket(context, x, y, this.height, true);

			this.displayAsList(context, x, y);

			//List.drawBrace(context, x + this.width, y, this.height, this.horzBaseline, false);
			List.drawSquareBracket(context, x + this.width, y, this.height, false);
		}
		else {
			this.displayAsMatrix(context, x, y);

			context.beginPath();

			context.moveTo (x + 5, y              ); // preventing obfuscation
			context.lineTo (x,     y              ); // preventing obfuscation
			context.lineTo (x,     y + this.height); // preventing obfuscation
			context.lineTo (x + 5, y + this.height); // preventing obfuscation
			
			context.moveTo (x + this.width - 5, y              ); // preventing obfuscation
			context.lineTo (x + this.width,     y              ); // preventing obfuscation
			context.lineTo (x + this.width,     y + this.height); // preventing obfuscation
			context.lineTo (x + this.width - 5, y + this.height); // preventing obfuscation

			context.stroke();
		}
	}

	moveAcross(son, direction) {
		let cols = this.parent instanceof Expression ? Utils.isMatrix(this.parent) :	0;
		
		if (cols > 0) {
			if (direction == Expression.PREVIOUS) {
				if (son == 0) {
					return this.parent.moveOut(direction);
				}
			}
			else if (direction == Expression.NEXT) {
				if (son == cols - 1) {
					return this.parent.moveOut(direction);
				}
			}
			else if (direction == Expression.UP) {
				let r = this.index;
				if (r == 0) {
					return this.parent.moveOut(Expression.UP);
				}
				else {
					return this.parent.children[r - 1].children[son].moveTo(Expression.UP);
				}
			}
			else { // DOWN
				let r = this.index;
				let rows = this.parent.children.length;
				if (r == rows - 1) {
					return this.parent.moveOut(Expression.DOWN);
				}
				else {
					return this.parent.children[r + 1].children[son].moveTo(Expression.DOWN);
				}
			}
		}
		
		if (this.cols > 0) {
			if (direction == Expression.NEXT || direction == Expression.PREVIOUS) {
				return this.moveOut(direction);
			}
			else if (direction == Expression.UP) {
				if (son == 0) {
					return this.moveOut(Expression.UP);
				}
				else {
					return this.children[son - 1].moveTo(Expression.UP);
				}
			}
			else { // DOWN
				if (son == this.children.length - 1) {
					return this.moveOut(Expression.DOWN);
				}
				else {
					return this.children[son + 1].moveTo(Expression.UP);
				}
			}
		}
		
		return super.moveAcross(son, direction);
	}
	
	moveTo(direction) {
		if (direction == Expression.UP) {
			if (this.cols > 0) {
				return this.children[this.children.length - 1].children[0].moveTo(Expression.UP);
			}
		}
		else if (direction == Expression.PREVIOUS) {
			if (this.cols > 0) {
				return this.children[0].children[this.cols - 1].moveTo(direction);
			}
		}
		
		return super.moveTo(direction);
	}
};

List.Table = class extends Expression {
	getTag() { return "List.Table"; }
	getName() { return "Table"; }
	getMnemonic() { return "Table"; }
	canHaveChildren(count)  { return count >= 1 && count <= 2; }
	
	prepareDisplay(context) {
		if (this.children.length == 1 && this.children[0].getTag() == "List.List" && this.children[0].children.length > 0) {
			this.cols = Utils.isMatrix(this.children[0]);
		}
		else {
			this.cols = -1;
		}
		
		if (this.cols <= 0) {
			this.prepareDisplayAsFunction(context);
		}
		else {
			let child = this.children[0];
			child.cols = this.cols;
			child.prepareDisplayAsMatrix(context, 15, 5);
			child.x = 0;
			child.y = 0;
			this.width = child.width;
			this.height = child.height;
			this.horzBaseline = child.horzBaseline;
			this.vertBaseline = child.vertBaseline;
		}
	}

	display(context, x, y) {
		if (this.cols <= 0) {
			this.displayAsFunction(context, x, y);
		}
		else {
			let child = this.children[0];
			child.displayAsMatrix(context, x, y);

			context.beginPath();

			for (let r = 1, R = child.children.length; r < R; ++r) {
				context.moveTo(x,              y + child.children[r].y - 7);
				context.lineTo(x + this.width, y + child.children[r].y - 7);
			}

			for (let c = 1; c < this.cols; ++c) {
				context.moveTo(x + child.xs[c] - 7, y              );
				context.lineTo(x + child.xs[c] - 7, y + this.height);
			}

			context.stroke();
		}
	}
};

List.UndecoratedTable = class extends Expression {
	getTag() { return "List.UndecoratedTable"; }
	getName() { return "Undecorated table"; }
	getMnemonic() { return "UndecoratedTable"; }
	canHaveChildren(count)  { return count >= 1 && count <= 2; }
	
	prepareDisplay(context) {
		if (this.children.length == 1 && this.children[0].getTag() == "List.List" && this.children[0].children.length > 0) {
			this.cols = Utils.isMatrix(this.children[0]);
		}
		else {
			this.cols = -1;
		}
		
		if (this.cols <= 0) {
			this.prepareDisplayAsFunction(context);
		}
		else {
			let child = this.children[0];
			child.cols = this.cols;
			child.prepareDisplayAsMatrix(context, 15, 0);
			child.x = 0;
			child.y = 0;
			this.width = child.width;
			this.height = child.height;
			this.horzBaseline = child.horzBaseline;
			this.vertBaseline = child.vertBaseline;
		}
	}

	display(context, x, y) {
		if (this.cols <= 0) {
			this.displayAsFunction(context, x, y);
		}
		else {
			let child = this.children[0];
			child.displayAsMatrix(context, x, y);
		}
	}
};

List.CreateList = class extends Expression.SummationLikeSymbol {
	constructor() {
		super();
		//this.symbol = "{}";
		this.symbol = "[ ]";
	}
	
	getTag() { return "List.CreateList"; }
	getName() { return List.messages.nameCreateList; }
	
	getChildName(index) {
		switch (index) {
			case 0: return List.messages.childCreateList0;
			case 1: return List.messages.childCreateList1;
			case 2: return this.children.length == 3 ? List.messages.childCreateList23 : List.messages.childCreateList2X;
			case 3: return List.messages.childCreateList3;
			case 4: return List.messages.childCreateList4;
		}
	}
}

List.CreateTable = class extends Expression.SummationLikeSymbol {
	constructor() {
		super();
		this.symbol = "⊤";
	}
	
	getTag() { return "List.CreateTable"; }
	getName() { return List.messages.nameCreateTable; }
	
	getChildName(index) {
		switch (index) {
			case 0: return List.messages.childCreateTable0;
			case 1: return List.messages.childCreateTable1;
			case 2: return this.children.length == 3 ? List.messages.childCreateTable23 : List.messages.childCreateTable2X;
			case 3: return List.messages.childCreateTable3;
			case 4: return List.messages.childCreateTable4;
		}
	}
}

List.CreateCrossedTable = class extends Expression.SummationLike {
	constructor() {
		super();
		this.widthSymbol = 40;
		this.heightSymbol = 40;
	}
	
	getTag() { return "List.CreateCrossedTable"; }
	getName() { return List.messages.nameCreateTable; }
	
	getChildName(index) {
		switch (index) {
			case 0: return List.messages.childCreateTable0;
			case 1: return List.messages.childCreateTable1;
			case 2: return this.children.length == 3 ? List.messages.childCreateTable23 : List.messages.childCreateTable2X;
			case 3: return List.messages.childCreateTable3;
			case 4: return List.messages.childCreateTable4;
		}
	}
	
	display(context, x, y) {
		let bkp = context.lineWidth;
		context.lineWidth = 3;
		context.beginPath();
		context.moveTo(x + this.vertBaselineSymbol - 15, y + this.horzBaseline - 15); context.lineTo(x + this.vertBaselineSymbol, y + this.horzBaseline);
		context.moveTo(x + this.vertBaselineSymbol, y + this.horzBaseline); context.lineTo(x + this.vertBaselineSymbol + 20, y + this.horzBaseline);
		context.moveTo(x + this.vertBaselineSymbol, y + this.horzBaseline); context.lineTo(x + this.vertBaselineSymbol, y + this.horzBaseline + 15);
		context.stroke();
		context.lineWidth = bkp;
		
		super.display(context, x, y);
	}
}

List.setExpressions = function(module) {
	Formulae.setExpression(module, "List.List",               List.List);
	Formulae.setExpression(module, "List.Table",              List.Table);
	Formulae.setExpression(module, "List.UndecoratedTable",   List.UndecoratedTable);
	Formulae.setExpression(module, "List.CreateList",         List.CreateList);
	Formulae.setExpression(module, "List.CreateTable",        List.CreateTable);
	Formulae.setExpression(module, "List.CreateCrossedTable", List.CreateCrossedTable);
	
	// sort
	Formulae.setExpression(module, "List.Sort", {
		clazz:         Expression.Function,
		getTag:        () => "List.Sort",
		getMnemonic:   () => List.messages.mnemonicSort,
		getName:       () => List.messages.nameSort,
		getChildName:  index => List.messages.childrenSort[index],
		min: 1, max: 2
	});
	
	// cartesian exponentiation
	Formulae.setExpression(module, "List.CartesianExponentiation", {
		clazz:        Expression.Superscript,
		getTag:       () => "List.CartesianExponentiation",
		getName:      () => List.messages.nameCartesianExponentiation,
		getChildName: index => List.messages.childrenCartesianExponentiation[index]
	});
	
	[ // several products
		[ "Cartesian", -2, null ],
		[ "Dot",        2,    2 ],
		[ "Outer",      2,    2 ]
	].forEach(row => Formulae.setExpression(module, "List." + row[0] + 'Product', {
		clazz:       Expression.Infix,
		getTag:      () => "List." + row[0] + "Product",
		getOperator: () => List.messages["operator" + row[0] + "Product"],
		getName:     () => List.messages["name" + row[0] + "Product"],
		min:         row[1],
		max:         row[2]
	}));

	// power set
	Formulae.setExpression(module, "List.PowerSet", {
		clazz:         Expression.Function,
		getTag:        () => "List.PowerSet",
		getMnemonic:   () => List.messages.mnemonicPowerSet,
		getName:       () => List.messages.namePowerSet,
		noParentheses: true
	});
	
	// to matrix
	Formulae.setExpression(module, "List.ToMatrix", {
		clazz:         Expression.Function,
		getTag:        () => "List.ToMatrix",
		getMnemonic:   () => List.messages.mnemonicToMatrix,
		getName:       () => List.messages.nameToMatrix,
		getChildName:  index => List.messages.childrenToMatrix[index],
		min: 2, max: 2
	});
	
	// excel type
	[ "RangeLookup", "ExactLookup" ].forEach(tag => Formulae.setExpression(module, 'List.Table.' + tag, {
		clazz:       Expression.Function,
		getTag:      () => "List.Table." + tag,
		getMnemonic: () => List.messages["mnemonic" + tag],
		getName:     () => List.messages["name" + tag],
		min: 2, max: 2
	}));
	
	Formulae.setExpression(module, "List.FromRange", {
		clazz:       Expression.Infix,
		getTag:      () => "List.FromRange",
		getOperator: () => "..",
		getName:     () => "From range",
		min:         2,
		max:         2
	});
};
