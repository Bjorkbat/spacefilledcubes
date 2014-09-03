#Space-Filled Cubes
================

In a nutshell, this is just a collection of Three.js I wrote for creating 3D space-filled cubes.

What the hell does that mean?  Well, these cubes have circles cut into them such that the cirlces are filling up
the sides of the cube using some sort of algorithm (more accurately, subtracting material from the cube), with
algorithm effectiveness measured based on how much of the cube's side has been removed given the number of circles
present, in addition to aesthetic appeal (though aesthetic appeal is less empirical).

The end result is a cube that's fun to look at.

##Types of cubes

###The "Riemann Cube"

My personal favorite (because it was the first).  The whole process is described
[Here](http://paulbourke.net/texture_colour/randomtile/).  In a nutshell, circle size is determined using the
Riemann zeta function.  The downside is that, given the dimensions of a cube's side and the number of circles, you're
guaranteed to get the same circle sizes again and again and again.
