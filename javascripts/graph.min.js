(function() {
    function Graph(data, canvas, options) {
        this.options = {
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            showCircle: false,
            circle: "#55AA77",
            circleSize: 4,
            background: "#FFFFFF",
            showZeroLine: false,
            centerZero: false,
            zeroLineColor: "#EEE",
            lineColor: "#C5C5C5",
            lineWidth: 3,
            showBounds: false,
            bounds: "#8888EE",
            boundsHeight: 14,
            boundsFont: "Arial",
            showLegend: false,
            legend: "#8888EE",
            legendHeight: 14,
            legendFont: "Arial",
        };

        if (typeof data !== 'object' && !Array.isArray(data)) throw new Error('Data is not an array');
        if (!canvas || !canvas.nodeName || canvas.nodeName !== "CANVAS") throw new Error('Canvas not defined');


        this.data = !!data.data ? data.data : data;
        this.legend = !!data.data ? data.legend : !1;
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        if (options) {
            for (var key in options) {
                if (options.hasOwnProperty(key)) this.options[key] = options[key];
            }
        }

        this.init();
        this.draw();
    }

    /**
     * Init graph
     */
    Graph.prototype.init = function() {
        var self = this;

        if (self.options.parentSize) {
            self.canvas.height = self.canvas.parentElement.offsetHeight;
            self.canvas.width = self.canvas.parentElement.offsetWidth;
        }

        if (self.options.showLegend) {
            self.options.paddingLeft = self.options.paddingLeft || self.options.legendHeight * 2;
            self.options.paddingRight = self.options.paddingRight || self.options.legendHeight * 2;
            self.options.paddingBottom = self.options.paddingBottom || self.options.legendHeight * 2.5;
        }

        if (self.options.showBounds) {
            self.options.paddingLeft = self.options.paddingLeft || self.options.boundsHeight / 1.4;
            self.options.paddingTop = self.options.paddingTop || self.options.boundsHeight * 1.4;
            self.options.paddingBottom = self.options.paddingBottom || self.options.boundsHeight * 1.4;
        }

        if (self.options.showCircle) {
            self.options.paddingRight = self.options.paddingRight || self.options.circleSize;
            self.options.paddingTop = self.options.paddingTop || self.options.circleSize;
            self.options.paddingBottom = self.options.paddingBottom || self.options.circleSize;
        }


        self.options.paddingTop = self.options.paddingTop || self.options.lineWidth;
        self.options.paddingBottom = self.options.paddingBottom || self.options.lineWidth;
    }

    /**
     * Draw the graph
     */
    Graph.prototype.draw = function() {
        var self = this;

        self.drawBackground();
        self.computeScale();
        self.drawMiddle();
        self.drawScale();
        self.drawData();
        self.drawCircle();
    };

    /**
     * Draw canvas brackground
     */
    Graph.prototype.drawBackground = function() {
        this.context.fillStyle = this.options.background;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };

    /**
     * Compute scale for given canvas size
     */
    Graph.prototype.computeScale = function() {
        var self = this,
            height = self.canvas.height,
            width = self.canvas.width;

        self.maxPositive = Math.max.apply(null, self.data);
        self.maxNegative = Math.min.apply(null, self.data);

        if (self.maxPositive == self.maxNegative) {
            if (self.maxPositive == 0) self.maxPositive = 1;
            if (self.maxPositive > 0) self.maxNegative = 0;
            if (self.maxPositive < 0) self.maxPositive = 0;
        }

        self.maxPositive = Math.abs(self.maxPositive);
        self.maxNegative = Math.abs(self.maxNegative);
        self.max = Math.max(self.maxPositive, self.maxNegative);

        height -= self.options.paddingTop + self.options.paddingBottom;
        width -= self.options.paddingLeft + self.options.paddingRight;

        self.horizontalScale = width / (self.data.length - 1);

        if (self.options.centerZero) {
            self.middle = Math.round(height / 2);
            self.verticalScale = self.middle / self.max;
        } else {
            self.verticalScale = height / (self.maxPositive - self.maxNegative);
            self.middle = Math.round(self.maxPositive * self.verticalScale);
        }
    };

    /**
     * Draw middle line of a graph
     */
    Graph.prototype.drawMiddle = function() {
        var self = this;

        if (!self.options.showZeroLine) return;

        self.context.moveTo(self.options.paddingLeft, self.middle + self.options.paddingTop);
        self.context.lineTo(self.canvas.width - self.options.paddingRight, self.middle + self.options.paddingTop);
        self.context.strokeStyle = self.options.zeroLineColor;
        self.context.stroke();
    };

    /**
     * Draw scale line
     */
    Graph.prototype.drawScale = function() {
        var self = this;

        if (!self.options.showBounds) return;

        self.context.moveTo(self.options.paddingLeft, self.options.paddingTop);
        self.context.lineTo(self.options.paddingLeft, self.canvas.height - self.options.paddingBottom);
        self.context.strokeStyle = self.options.zeroLineColor;
        self.context.stroke();
    };

    /**
     * Draw data line     
     */
    Graph.prototype.drawData = function() {
        var self = this,
            i = self.data.length - 2;

        self.context.strokeStyle = self.options.lineColor;
        self.context.lineWidth = self.options.lineWidth;

        self.context.beginPath();
        self.context.moveTo.apply(self.context, self.getPointCoordinates(self.data.length - 1));

        for (; i >= 0; i--) {
            self.context.lineTo.apply(self.context, self.getPointCoordinates(i));
        }

        self.context.stroke();
    };

    /**
     * Compute coordinates for asked data index
     * @param  {index} index
     * @return {array}
     */
    Graph.prototype.getPointCoordinates = function(index) {
        return [
            this.options.paddingLeft + (index * this.horizontalScale),
            (this.middle + this.options.paddingTop) - (this.verticalScale * this.data[index])
        ]
    };

    /**
     * Draw circle to the end of the graph
     */
    Graph.prototype.drawCircle = function() {
        var self = this;

        if (!self.options.showCircle) return;

        var lastPoint = self.getPointCoordinates(self.data.length - 1);

        self.context.fillStyle = self.options.circle;
        self.context.beginPath();
        self.context.arc(lastPoint[0], lastPoint[1], self.options.circleSize, 0, 2 * Math.PI);
        self.context.closePath();
        self.context.fill();
    };

    this.Graph = Graph;
})(this);