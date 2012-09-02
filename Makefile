INSTALL_DIR := $(shell realpath ~/.local/share/cinnamon/applets/hwmonitor@sylfurd)

all : help

help :
	@echo "Usage:"
	@echo "  ${MAKE} install"
	@echo "  ${MAKE} uninstall"

copy_files := applet.js metadata.json
dst_files := $(addprefix ${INSTALL_DIR}/,${copy_files})

install : ${dst_files}

uninstall :
	rm -rf ${INSTALL_DIR}

${INSTALL_DIR} :
	mkdir -p $@

${dst_files} : ${INSTALL_DIR}/% : hwmonitor@sylfurd/% | ${INSTALL_DIR}
	cp $< $@

.PHONY : all help install uninstall
