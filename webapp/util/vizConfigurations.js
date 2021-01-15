sap.ui.define([], function () {
	"use strict";

	var capacidadOciosaTon;

	return {
		getMetaDespachoDataPointStyle: function () {
			var treeConfig = {
				rules: [{
					dataContext: {
						Minutos: {
							max: 180
						}
					},
					properties: {
						color: "sapUiChartPaletteSemanticGood"
					},
					displayName: "<=180 Minutos"
				}, {
					dataContext: {
						Minutos: {
							min: 181,
							max: 220
						}
					},
					properties: {
						color: "sapUiChartPaletteSemanticCritical"
					},
					displayName: ">180 | <220 Minutos"
				}, {
					dataContext: {
						Minutos: {
							min: 221
						}
					},
					properties: {
						color: "sapUiChartPaletteSemanticBad"
					},
					displayName: ">220 Minutos"
				}]
			};
			return treeConfig;
		},
		getCapacidadOciosaTonDataPointStyle: function () {
			capacidadOciosaTon = {
				rules: [{
					dataContext: {
						Estado: {
							max: 1
						}
					},
					properties: {
						color: "#19A979"
					},
					displayName: "PC Kilos Asignados"
				}, {
					dataContext: {
						Estado: {
							min: 2
						}
					},
					properties: {
						color: "#525DF4"
					},
					displayName: "PC Kilos No Asignados"
				}]
			};
			return capacidadOciosaTon;
		},
		setCapacidadOciosaTonDisplayName: function (data) {
			var assignedKilos = 0,
				unAsignedKilos = 0;

			var planCarga = {
				estado: {
					Listo: "01",
					EnProceso: "02",
					Pendiente: "03"
				}
			};

			for (var index = 0; index < data.length; index++) {
				switch (data[index].Estado) {
				case planCarga.estado.Listo:
					assignedKilos += parseInt(data[index].Kilos, 10);
					break;
				case planCarga.estado.EnProceso:
					unAsignedKilos += parseInt(data[index].Kilos, 10);
					break;
				case planCarga.estado.Pendiente:
					unAsignedKilos += parseInt(data[index].Kilos, 10);
					break;
				}
			}

			assignedKilos = assignedKilos.toLocaleString();
			unAsignedKilos = unAsignedKilos.toLocaleString();

			for (var i = 0; i < capacidadOciosaTon.rules.length; i++) {
				if (i === 0) {
					capacidadOciosaTon.rules[i].displayName = assignedKilos + " Kilos Asignados";
				} else {
					capacidadOciosaTon.rules[i].displayName = unAsignedKilos + " Kilos No Asignados";
				}
			}

			return capacidadOciosaTon;
		},
		getAlistadoCustomPopOver: function (selection, odata) {
			
			var table = new sap.m.Table({});
			var filtro;
			var colorPopUp;
			if (selection[0].data.Estado === "Listo") {
				filtro = "01";
				colorPopUp = "#3fa45b"; //Verde
			} else if (selection[0].data.Estado === "Pendiente") {
				filtro = "02";
				colorPopUp = "#ffde08"; //Amarillo
			} else if (selection[0].data.Estado === "En proceso") {
				filtro = "03";
				colorPopUp = "#dc0d0e"; //Rojo
			}

			var arrTransportes = [];

			for (var i = 0; i < odata.results.length; i++) {

				if (odata.results[i].Estado === filtro) {
					arrTransportes.push(odata.results[i].Transporte);
				}
			}

			var aColumnData = [{
				columnId: "Transportes - " + selection[0].data.Estado
			}];

			// Creacion de objeto JSON para el bind de la tabla pop-up
			var jsonArr = [];

			for (var j = 0; j < arrTransportes.length; j++) {
				jsonArr.push({
					Transporte: arrTransportes[j]
				});
			}

			var popModel = new sap.ui.model.json.JSONModel();
			popModel.setData({
				columns: aColumnData,
				rows: jsonArr
			});

			table.setModel(popModel);

			table.bindAggregation("columns", "/columns", function (index, context) {
				return new sap.m.Column({
					header: new sap.m.Label({
						text: context.getObject().columnId
					}),
					hAlign: "Center",
					footer: new sap.ui.core.Icon({
						src: "sap-icon://color-fill",
						color: colorPopUp
					})
				});
			});
			
			table.bindItems("/rows", function (index, context) {
				var obj = context.getObject();
				var row = new sap.m.ColumnListItem();
				for (var k in obj) {
					row.addCell(new sap.m.Text({
						text: obj[k]
					}));
				}
				return row;
			});
			return table;
		}
	};

});