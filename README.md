cinnamon_hwmonitor
==================

This is hwmonitor for cinnamon fork. It adds networks speed graph.

Currently it enumerates network interfaces on start up and hence doesn't react to dynamically added or removed network interfaces because it doesn't listen to NetworkManager notifications.


Installation
============
make install

Uninstallation
==============
make uninstall

TODO
====
* Use NetworkManager to receive network interface add/remove notifications.
* Add tooltips that show the current value of CPU usage, memory usage and network when hoovering the mouse over the applet.
* Make graph colors configureable.
