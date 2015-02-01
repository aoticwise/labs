'use strict';
importScripts('../../js/libs/oimo.min.js');

var ar;
var dr;
var drn;
var sim = null;
var world = null;

self.onmessage = function(e) {
	var m = e.data.m;
	if(m==='room') sim.room(e.data.obj);
	if(m==='add')  sim.add(e.data.obj);
	if(m==='run'){
		ar = e.data.ar;
		dr = e.data.dr;
		drn = e.data.drn;
		if(world===null) sim.init(e.data);
		else sim.isWorld = true;
		sim.step();
		// Send data back to the main thread...
	    self.postMessage({ w:sim.isWorld, fps:sim.f[3], ar:ar, dr:dr },[ar.buffer]);
	}
}

var W = {};

W.Sim = function(){
	this.p = 4; // precission
	this.f = [0,0,0,0]; // fps
	this.groups = [0xffffffff, 1 << 0, 1 << 1, 1 << 2];
    this.isWorld = false;
    this.bodys = [];
}

W.Sim.prototype = {
	constructor: W.Sim,
	init:function(data){
		this.d = data.d || [0.01667, 8, 2];
		world = new OIMO.World( this.d[0], this.d[2], this.d[1] );
		world.gravity = new OIMO.Vec3(0, -10, 0);
		world.worldscale(1);
	},
	step:function(){
		var f = this.f, p = this.p, i, id, b, pos, quat;
		world.step();
		i = this.bodys.length;
		while(i--){
			b = this.bodys[i].body;
			id=i*8;
			if(b.sleeeping)ar[id] = 0;
			else{
				ar[id] = 1;
				pos = b.getPosition();
				ar[id+1] = pos.x.toFixed(p)*1;
				ar[id+2] = pos.y.toFixed(p)*1;
				ar[id+3] = pos.z.toFixed(p)*1;
				quat = b.getQuaternion();
				ar[id+4] = quat.x.toFixed(p)*1;
				ar[id+5] = quat.y.toFixed(p)*1;
				ar[id+6] = quat.z.toFixed(p)*1;
				ar[id+7] = quat.w.toFixed(p)*1;	
			}
		}
		f[1] = Date.now();
	    if(f[1]-1000>f[0]){ f[0]=f[1]; f[3]=f[2]; f[2]=0; } f[2]++;
	},
	clear:function(){
		world.clear();
	},
	room:function (s){
		new OIMO.Body({ type:'box', size:[s.w,s.m,s.d], pos:[ 0,-s.m*0.5, 0      ], world:world });
		new OIMO.Body({ type:"box", size:[s.w,s.h,s.m], pos:[ 0, s.h*0.5,-s.d*0.5], world:world });
	    new OIMO.Body({ type:"box", size:[s.w,s.h,s.m], pos:[ 0, s.h*0.5, s.d*0.5], world:world });
	    new OIMO.Body({ type:"box", size:[s.m,s.h,s.d], pos:[-s.w*0.5, s.h*0.5,0 ], world:world });
	    new OIMO.Body({ type:"box", size:[s.m,s.h,s.d], pos:[ s.w*0.5, s.h*0.5,0 ], world:world });
	},
	add:function(obj){
		obj.world = world;
		obj.move = true;
		this.bodys[this.bodys.length] = new OIMO.Body(obj);
	}
}

sim = new W.Sim();