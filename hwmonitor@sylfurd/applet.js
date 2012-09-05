/*
Copyright 2012 Renaud Delcoigne (Aka Sylfurd)
Copyright 2012 Maxim Yegorushkin

This file is part of HWMonitor

HWMonitor is free software: you can redistribute it and/or modify it under the
terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

Foobar is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
details.

You should have received a copy of the GNU General Public License along
with Foobar. If not, see http://www.gnu.org/licenses/.
*/

const Applet = imports.ui.applet;
const Cinnamon = imports.gi.Cinnamon;
const GTop = imports.gi.GTop;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Cairo = imports.cairo;
const Gio = imports.gi.Gio;

function MyApplet(orientation) {
	this._init(orientation);
}

MyApplet.prototype = {
	__proto__: Applet.Applet.prototype,

    _init: function(orientation) {
        Applet.Applet.prototype._init.call(this, orientation);

		try {
			let cpuProvider = new CpuDataProvider();
			let memProvider = new MemDataProvider();
			let netProvider = new NetDataProvider();

			let cpuGraph = new Graph(cpuProvider);
			let memGraph = new Graph(memProvider);
            let netGraph = new NetGraph(netProvider);

			this.graphs = [
			    cpuGraph,
			    memGraph,
			    netGraph,
            ];

			this.itemOpenSysMon = new PopupMenu.PopupMenuItem("Open System Monitor");
			this.itemOpenSysMon.connect('activate', Lang.bind(this, this._runSysMonActivate));
			this._applet_context_menu.addMenuItem(this.itemOpenSysMon);

			this.graphArea = new St.DrawingArea();
			this.graphArea.width = this.graphs.length * 45;
			this.graphArea.connect('repaint', Lang.bind(this, this.onGraphRepaint));

			this.actor.add_actor(this.graphArea);

		    Mainloop.timeout_add(1000, Lang.bind(this, this._update));
			this._update();
		}
		catch (e) {
			global.logError(e);
		}
	},

	on_applet_clicked: function(event) {
		this._runSysMon();
	},

	_runSysMonActivate: function() {
		this._runSysMon();
	},

	_update: function() {

		for(let i = 0; i < this.graphs.length; i++)
		{
			this.graphs[i].refreshData();
		}

		this.graphArea.queue_repaint();

        return true;
	},

	_runSysMon: function() {
		let _appSys = Cinnamon.AppSystem.get_default();
		let _gsmApp = _appSys.lookup_app('gnome-system-monitor.desktop');
		_gsmApp.activate();
	},

	onGraphRepaint: function(area) {
		try {
			for(let index = 0, x_offset = 0; index < this.graphs.length; index++)
			{
				area.get_context().translate(x_offset, 0);
                x_offset = 45;
				this.graphs[index].paint(area);
			}
		}catch(e)
		{
			global.logError(e);
		}
	}
};

function Graph(area, provider) {
	this._init(area, provider);
}

Graph.prototype = {
	_init: function(_provider) {
		this.width = 41;
		this.datas = new Array(this.width);

		for(let i = 0; i <this.datas.length; i++)
        {
        	this.datas[i] = 0;
        }

		this.height = 20;
		this.provider = _provider;

        this._pattern = new Cairo.LinearGradient(0, 0, 0, this.height);
        this._pattern.addColorStopRGBA(0, 1, 0, 0, 1);
        this._pattern.addColorStopRGBA(0.5, 1, 1, 0.2, 1);
        this._pattern.addColorStopRGBA(0.7, 0.4, 1, 0.3, 1);
        this._pattern.addColorStopRGBA(1, 0.2, 0.7, 1, 1);
	},

	paint: function(area)
	{
		let cr = area.get_context();

		// Border
        cr.setSourceRGBA(1, 1, 1, 0.9);
        cr.setLineWidth(1);
        cr.rectangle(0.5, 0.5, this.width+0.5, this.height+0.5);
        cr.stroke();

		// Background
        let gradientHeight = this.height-1;
        let gradientWidth = this.width-1;
        let gradientOffset = 1;
        let pattern = new Cairo.LinearGradient(0, 0, 0, this.height);
        pattern.addColorStopRGBA(0, 1, 1, 1, 0.3);
        pattern.addColorStopRGBA(1, 0, 0, 0, 0.3);
        cr.setSource(pattern);
        cr.rectangle(1, gradientOffset, gradientWidth, gradientHeight);
        cr.fill();

        // Grid
        cr.setLineWidth(1);
        cr.setSourceRGBA(1, 1, 1, 0.4);
        cr.moveTo(0, Math.round(this.height/2)+0.5);
        cr.lineTo(this.width, Math.round(this.height/2)+0.5);
        cr.stroke();
        cr.moveTo(Math.round(this.width*0.5)+0.5, 0);
        cr.lineTo(Math.round(this.width*0.5)+0.5, this.height);
        cr.stroke();
        cr.setSourceRGBA(1, 1, 1, 0.2);
        cr.moveTo(0, Math.round(this.height*0.25)+0.5);
        cr.lineTo(this.width, Math.round(this.height*0.25)+0.5);
        cr.stroke();
        cr.moveTo(0, Math.round(this.height*0.75)+0.5);
        cr.lineTo(this.width, Math.round(this.height*0.75)+0.5);
        cr.stroke();
        cr.moveTo(Math.round(this.width*0.25)+0.5, 0);
        cr.lineTo(Math.round(this.width*0.25)+0.5, this.height);
        cr.stroke();
        cr.moveTo(Math.round(this.width*0.75)+0.5, 0);
        cr.lineTo(Math.round(this.width*0.75)+0.5, this.height);
        cr.stroke();

        this._plotData(cr);

        // Label
        let name = this.provider.getName();
		cr.setFontSize(7);
        cr.setSourceRGBA(0, 0, 0, 0.5);
		cr.moveTo(2.5, 7.5);
		cr.showText(name);
        cr.setSourceRGBA(1, 1, 1, 1);
		cr.moveTo(2, 7);
		cr.showText(name);
    },

    _plotData: function(cr)
    {
        // Datas
        cr.setLineWidth(0);
        cr.moveTo(1, this.height - this.datas[0]);

        for(let i = 1; i <this.datas.length; i++)
        {
        	cr.lineTo(1+i, this.height - this.datas[i]);
        }

    	cr.lineTo(this.datas.length, this.height);
    	cr.lineTo(1, this.height);

    	cr.closePath();

        cr.setSource(this._pattern);
        cr.fill();
    },

	refreshData: function()
	{
		let data = this.provider.getData()*(this.height-1);

		if (this.datas.push(data)>this.width-2)
		{
			this.datas.shift();
		}
	}
};

function NetGraph(provider) {
	this._init(provider);
}

NetGraph.prototype = {
    __proto__: Graph.prototype,

	_init: function(_provider) {
		this.width = 41;
		this.rx = [];
        this.tx = [];
        this.max_speed = 1;
		for(let i = 0; i < this.width; ++i) {
        	this.rx[i] = 0;
        	this.tx[i] = 0;
        }

		this.height = 20;
		this.provider = _provider;

        this._pattern = new Cairo.LinearGradient(0, 0, 0, this.height);
        this._pattern.addColorStopRGBA(0, 1, 0, 0, 1);
        this._pattern.addColorStopRGBA(0.5, 1, 1, 0.2, 1);
        this._pattern.addColorStopRGBA(0.7, 0.4, 1, 0.3, 1);
        this._pattern.addColorStopRGBA(1, 0.2, 0.7, 1, 1);
    },

	refreshData: function() {
        let [rx_speed, tx_speed] = this.provider.getData();
        this.rx.push(rx_speed);
        this.tx.push(tx_speed);

        // Rescale the plot if new max speed is reached.
        if(rx_speed > this.max_speed)
            this.max_speed = rx_speed;
        if(tx_speed > this.max_speed)
            this.max_speed = tx_speed;

        if(this.rx.length > this.width - 2) {
            let max_old = Math.max(this.rx.shift(), this.tx.shift());
            // Rescale the plot if the max value shifts into oblivion.
            if(max_old >= this.max_speed)
                this.max_speed = Math.max(
                    Math.max.apply(null, this.rx),
                    Math.max.apply(null, this.tx)
                    );
        }
    },

    _plotData: function(cr) {
        let scaler = (this.height - 1) / this.max_speed;
        let height = this.height;
        function plotSeries(series) {
            cr.moveTo(1, height - scaler * series[0]);
            for(let i = 1; i < series.length; ++i) {
        	    cr.lineTo(1+i, height - scaler * series[i]);
            }
    	    cr.lineTo(series.length, height);
    	    cr.lineTo(1, height);

    	    cr.closePath();
            cr.fill();
        }

        cr.setLineWidth(0);

        cr.setSourceRGBA(0, 1, 0, .75);
        plotSeries(this.rx);

        cr.setSourceRGBA(1, 1, 0, .75);
        plotSeries(this.tx);
    },
};

function CpuDataProvider() {
	this._init();
}

CpuDataProvider.prototype = {

	_init: function(){
		this.gtop = new GTop.glibtop_cpu();
		this.current = 0;
		this.last = 0;
		this.usage = 0;
		this.last_total = 0;
	},

	getData: function()
	{
		GTop.glibtop_get_cpu(this.gtop);

		this.current = this.gtop.idle;

		let delta = (this.gtop.total - this.last_total);
		if (delta > 0) {
			this.usage =(this.current - this.last) / delta;
			this.last = this.current;

			this.last_total = this.gtop.total;
		}

		return 1-this.usage;
	},

	getName: function()
	{
		return "CPU";
	}
};

function MemDataProvider() {
	this._init();
}

MemDataProvider.prototype = {

	_init: function(){
			this.gtopMem = new GTop.glibtop_mem();
	},

	getData: function()
	{
		GTop.glibtop_get_mem(this.gtopMem);

		return 1 - (this.gtopMem.buffer + this.gtopMem.cached + this.gtopMem.free) / this.gtopMem.total;
	},

	getName: function()
	{
		return "MEM";
	}
};


function Itf(name) {
    this._init(name);
}

Itf.prototype = {
    _init: function(name) {
        this.name = name;
        this.last_rx_bytes = this.rx_bytes;
        this.last_tx_bytes = this.tx_bytes;
    },

    _open_fstream: function(suffix) {
        let filename = "/sys/class/net/" + this.name + "/statistics/" + suffix;
        return Gio.file_new_for_path(filename).read(null);
    },

    _parse_number: function(fstream) {
        //fstream.seek(0, 1, null);
        let dstream = Gio.DataInputStream.new(fstream);
        let [number, read] = dstream.read_line(null);
        dstream.close(null);
        fstream.close(null);
        return Number(number);
    },

    // Somehow fstreams created in the constructor get closed after a few reads, hence keep
    // re-opening files to make it work. TODO: investigate this.
    get rx_bytes() { return this._parse_number(this._open_fstream("rx_bytes")); },
    get tx_bytes() { return this._parse_number(this._open_fstream("tx_bytes")); },

    update: function() {
        let rx_bytes = this.rx_bytes;
        let rx_bytes_delta = rx_bytes - this.last_rx_bytes;
        this.last_rx_bytes = rx_bytes;

        let tx_bytes = this.tx_bytes;
        let tx_bytes_delta = tx_bytes - this.last_tx_bytes;
        this.last_tx_bytes = tx_bytes;

        return [rx_bytes_delta, tx_bytes_delta];
    }
}

function Itfs() {
    this.dump = function() {
        for(let i = 0, j = this.itfs.length; i < j; ++i) {
            let itf = this.itfs[i];
            print(itf.name, itf.rx_bytes, itf.tx_bytes);
        }
    }

    this.update = function() {
        let now = (new Date()).valueOf();
        let sec_since_last_update = (now - this.last_update || 1) / 1e3;
        this.last_update = now;

        let rx_bytes_delta_total = 0;
        let tx_bytes_delta_total = 0;
        for(let i = 0, j = this.itfs.length; i < j; ++i) {
            let itf = this.itfs[i];
            let [rx_bytes_delta, tx_bytes_delta] = itf.update();
            rx_bytes_delta_total += rx_bytes_delta;
            tx_bytes_delta_total += tx_bytes_delta;
        }

        return [
            rx_bytes_delta_total / sec_since_last_update,
            tx_bytes_delta_total / sec_since_last_update
        ];
    }

    this.itfs = [];
    let net_dir = Gio.file_new_for_path("/sys/class/net");
    let info;
    let file_enum = net_dir.enumerate_children('standard::name,standard::type', Gio.FileQueryInfoFlags.NONE, null);
    while((info = file_enum.next_file(null)) != null) {
        if(info.get_file_type() !== Gio.FileType.DIRECTORY)
            continue;
        // Skip interfaces with no device. This filters out interfaces like "lo" and "vmnet".
        let itf = info.get_name();
        let device = net_dir.get_child(itf).get_child("device");
        if(!device.query_exists(null))
            continue;
        this.itfs.push(new Itf(itf));
    }
    this.last_update = 0;
    this.update();
}

function NetDataProvider() {
	this._init();
}

NetDataProvider.prototype = {
	_init: function(){
        this.itfs = new Itfs();
	},

	getData: function()	{
        return this.itfs.update();
	},

	getName: function()	{
		return "NET";
	}
};


function main(metadata, orientation) {
	let myApplet = new MyApplet(orientation);
	return myApplet;
}
