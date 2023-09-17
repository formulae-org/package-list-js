/*
Fōrmulæ list package. Module for expression definition & visualization.
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

List.drawBrace = function(context, x, y, height, baseline, opening) {
	context.beginPath();

	if (opening) {
		context.moveTo (x + 4, y               ); //    . // preventing obfuscation
		context.lineTo (x + 2, y + 2           ); //   /  // preventing obfuscation
		context.lineTo (x + 2, y + baseline - 2); //   |  // preventing obfuscation
		context.lineTo (x,     y + baseline    ); //  /   // preventing obfuscation
		context.lineTo (x + 2, y + baseline + 2); //  \.  // preventing obfuscation
		context.lineTo (x + 2, y + height - 2  ); //   |  // preventing obfuscation
		context.lineTo (x + 4, y + height      ); //   \  // preventing obfuscation
	}
	else {
		context.moveTo (x - 4, y               ); // .    // preventing obfuscation
		context.lineTo (x - 2, y + 2           ); //  \.  // preventing obfuscation
		context.lineTo (x - 2, y + baseline - 2); //  |   // preventing obfuscation
		context.lineTo (x,     y + baseline    ); //   \. // preventing obfuscation
		context.lineTo (x - 2, y + baseline + 2); //   /  // preventing obfuscation
		context.lineTo (x - 2, y + height - 2  ); //  |   // preventing obfuscation
		context.lineTo (x - 4, y + height      ); //  /   // preventing obfuscation
	}

	context.stroke();
}

List.prepareDisplayAsMatrix = function(context, expr, space, border) {
	let r, c;
	let rows = expr.children.length;
	let row, child;
	
	let maxHorzBaseline = new Array(rows).fill(0);
	let maxSemiHeight   = new Array(rows).fill(0);
	let maxVertBaseline = new Array(expr.cols).fill(0);
	let maxSemiWidth    = new Array(expr.cols).fill(0);
	
	for (r = 0; r < rows; ++r) {
		row = expr.children[r];

		for (c = 0; c < expr.cols; ++c) {
			(child = row.children[c]).prepareDisplay(context);
			
			if (child.horzBaseline > maxHorzBaseline[r]) {
				maxHorzBaseline[r] = child.horzBaseline;
			}
			
			if (child.height - child.horzBaseline > maxSemiHeight[r]) {
				maxSemiHeight[r] = child.height - child.horzBaseline;
			}
			
			if (child.vertBaseline > maxVertBaseline[c]) {
				maxVertBaseline[c] = child.vertBaseline;
			}
			
			if (child.width - child.vertBaseline > maxSemiWidth[c]) {
				maxSemiWidth[c] = child.width - child.vertBaseline;
			}
		}
	}

	expr.xs = new Array(expr.cols);
	
	expr.width = border;
	let centers = new Array(expr.cols).fill(0);
	for (c = 0; c < expr.cols; ++c) {
		if (c > 0) expr.width += space;
		expr.xs[c] = expr.width;
		expr.width += maxVertBaseline[c];
		centers[c] = expr.width;
		expr.width += maxSemiWidth[c];
	}
	expr.width += border;
	

	expr.height = border;
	for (r = 0; r < rows; ++r) {
		row = expr.children[r];
		
		if (r > 0) expr.height += space;
		
		row.x = 0;
		row.y = expr.height;
		row.width = expr.width;
		row.height = maxHorzBaseline[r] + maxSemiHeight[r];
		
		for (c = 0; c < expr.cols; ++c) {
			child = row.children[c];
			
			child.x = centers[c] - child.vertBaseline;
			child.y = maxHorzBaseline[r] - child.horzBaseline;
		}
		
		expr.height += maxHorzBaseline[r] + maxSemiHeight[r];
	}
	expr.height += border;
	
	expr.vertBaseline = Math.round(expr.width / 2);
	expr.horzBaseline = Math.round(expr.height / 2);
}

List.displayAsMatrix = function(context, expr, x, y) {
	let row, child;
	
	for (let r = 0, rows = expr.children.length; r < rows; ++r) {
		row = expr.children[r];
		for (let c = 0; c < expr.cols; ++c) {
			(child = row.children[c]).display(
				context,
				x + row.x + child.x,
				y + row.y + child.y
			);
		}
	}
}

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
			List.prepareDisplayAsMatrix(context, this, 10, 5);
		}
	}

	display(context, x, y) {
		if (this.cols <= 0) {
			List.drawBrace(context, x, y, this.height, this.horzBaseline, true);

			this.displayAsList(context, x, y);

			List.drawBrace(context, x + this.width, y, this.height, this.horzBaseline, false);
		}
		else {
			List.displayAsMatrix(context, this, x, y);

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

//List.Table = class extends Expression.UnaryExpression {
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
			List.prepareDisplayAsMatrix(context, child, 15, 5);
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
			List.displayAsMatrix(context, child, x, y);
			
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

List.CreateList = class extends Expression.SummationLike {
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

	display(context, x, y) {
		List.drawBrace(context, x,     y + this.top, this.bottom - this.top, this.horzBaseline - this.top, true);
		List.drawBrace(context, x + 1, y + this.top, this.bottom - this.top, this.horzBaseline - this.top, true);
		List.drawBrace(
			context,
			x + this.children[0].x - 5,
			y + this.top, this.bottom - this.top, this.horzBaseline - this.top, false
		);
		List.drawBrace(
			context,
			x + this.children[0].x - 6,
			y + this.top, this.bottom - this.top, this.horzBaseline - this.top, false
		);

		super.display(context, x, y);
	}
}

List.CreateTable = class extends Expression.SummationLike {
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

	display(context, x, y) {
		let w = this.children[0].x - 5;
		let sw = w / 2;

		context.beginPath();
		context.moveTo (x,      y + this.top); context.lineTo(x + w,  y + this.top   ); // preventing obfuscation
		context.moveTo (x + sw, y + this.top); context.lineTo(x + sw, y + this.bottom); // preventing obfuscation
		context.stroke();

		super.display(context, x, y);
	}
}

List.CreateCrossedTable = class extends Expression.SummationLike {
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
		let w = this.children[0].x - 5;
		let sw = w / 2;
		let sh = (this.bottom - this.top) / 2;

		context.beginPath();
		context.moveTo (x, y + this.top); context.lineTo(x + sw, y + this.top + sh); // preventing obfuscation
		context.moveTo (x + sw, y + this.top + sh); context.lineTo(x + w, y + this.top + sh);
		context.moveTo (x + sw, y + this.top + sh); context.lineTo(x + sw, y + this.bottom);
		context.stroke();

		super.display(context, x, y);
	}
}

List.Determinant = class extends Expression.UnaryExpression {
	getTag() { return "Math.Matrix.Determinant"; }
	getName() { return List.messages.nameDeetrminant; }
	getChildName() { return List.messages.childDeterimant; }

	prepareDisplay(context) {
		let child = this.children[0];
		let cols = Utils.isMatrix(child);

		if (cols < 0) {
			child.prepareDisplay(context);
		}
		else {
			child.cols = cols;
			List.prepareDisplayAsMatrix(context, child, 10, 0);
		}
		
		child.x = child.y = 5;
		this.width = child.width + 10;
		this.height = child.height + 10;
		this.horzBaseline = 5 + child.horzBaseline;
		this.vertBaseline = 5 + child.vertBaseline;
	}
	
	display(context, x, y) {
		let child = this.children[0];
		
		if (child.cols === undefined || child.cols < 0) {
			child.display(context, x + child.x, y + child.y);
		}
		else {
			List.displayAsMatrix(context, child, x + child.x, y + child.y);
		}
		
		context.beginPath();
		context.moveTo (x,              y); context.lineTo(x,              y + this.height); // preventing obfuscation
		context.moveTo (x + this.width, y); context.lineTo(x + this.width, y + this.height); // preventing obfuscation
		context.stroke();
	}
}

List.setExpressions = function(module) {
	Formulae.setExpression(module, "List.List",               List.List);
	Formulae.setExpression(module, "List.Table",              List.Table);
	Formulae.setExpression(module, "List.CreateList",         List.CreateList);
	Formulae.setExpression(module, "List.CreateTable",        List.CreateTable);
	Formulae.setExpression(module, "List.CreateCrossedTable", List.CreateCrossedTable);
	Formulae.setExpression(module, "Math.Matrix.Determinant", List.Determinant);
	
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
		clazz:        Expression.Exponentiation,
		getTag:       () => "List.CartesianExponentiation",
		getName:      () => List.messages.nameCartesianExponentiation,
		getChildName: index => List.messages.childrenCartesianExponentiation
	});
	
	[ // several products
		[ "Math.Matrix", "Kronecker", -2, null ],
		[ "List",        "Cartesian", -2, null ],
		[ "List",        "Dot",        2,    2 ],
		[ "List",        "Outer",      2,    2 ]
	].forEach(row => Formulae.setExpression(module, row[0] + "." + row[1] + 'Product', {
		clazz:       Expression.Infix,
		getTag:      () => row[0] + "." + row[1] + "Product",
		getOperator: () => List.messages["operator" + row[1] + "Product"],
		getName:     () => List.messages["name" + row[1] + "Product"],
		min:         row[2],
		max:         row[3]
	}));
	
	// transpose & adjoint matrix operations
	[ "Transpose", "Adjoint" ].forEach(tag => Formulae.setExpression(module, 'Math.Matrix.' + tag, {
		clazz:      Expression.SuperscriptedLiteral,
		getTag:     () => "Math.Matrix." + tag,
		getLiteral: () => List.messages["literal" + tag],
		getName:    () => List.messages["name" + tag]
	}));
	
	// power set
	Formulae.setExpression(module, "List.PowerSet", {
		clazz:         Expression.Function,
		getTag:        () => "List.PowerSet",
		getMnemonic:   () => List.messages.mnemonicPowerSet,
		getName:       () => List.messages.namePowerSet,
		noParentheses: true
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
