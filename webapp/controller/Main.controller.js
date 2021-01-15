sap.ui.define([
	"zdashboardgcial/zdashboardgcial/util/app/controller",
	"sap/ui/model/json/JSONModel",
	"zdashboardgcial/zdashboardgcial/util/models",
	"zdashboardgcial/zdashboardgcial/util/gateway",
	"sap/ui/core/BusyIndicator",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/viz/ui5/format/ChartFormatter",
	"sap/viz/ui5/api/env/Format",
	"zdashboardgcial/zdashboardgcial/util/vizConfigurations"
], function (Controller, JSONModel, models, gateway, BusyIndicator, Fragment, MessageBox, ChartFormatter, Format, vizConfig) {
	"use strict";
	/* eslint-disable no-console */

	var mainService = "DASHBOARD_GERENCIAL";
	var firstDisplay = false;
	var timerFragmentText;

	function generateVizFrame(object, context, centro, fechaDesde, fechaHasta) {
		gateway.read(mainService, object.path, {
				"filters": [centro, fechaDesde, fechaHasta]
			})
			.then(function (res) {
				var responseSet = res.results;
				models.get("Model_Main").setProperty(object.model, responseSet);
				var oVizFrame = context.oVizFrame = context.getView().byId(object.frameId);
				oVizFrame.setVizProperties({
					title: {
						text: object.title,
						visible: true
					},
					plotArea: {
						colorPalette: object.colorPalette,
						dataLabel: {
							visible: true,
							showTotal: true,
							type: "value"
						},
						drawingEffect: "glossy",
						dataPointStyle: object.dataPointStyle
					}
				});
				var oPopOver = context.getView().byId(object.popOver);
				oPopOver.connect(oVizFrame.getVizUid());

				if (object.customPopOver) {
					gateway.read(mainService, object.popOverPath, {}).then(function (popOv) {
						oPopOver.setCustomDataControl(function (data) {
								var seleccion = oVizFrame.vizSelection(); // Recuperamos los puntos seleccionados
								console.log(seleccion);
								var popUpTable = vizConfig.getAlistadoCustomPopOver(seleccion, popOv);
								return popUpTable;

							}.bind(this) // Estamos "pasando el this" de la vista al interior de la función...
						);
					});
				}

				BusyIndicator.hide();
			})
			.catch(function (error) {
				BusyIndicator.hide();
				error = error;
			});
	}

	function msToHMS(ms) {
		// 1- Convert to seconds:
		var seconds = ms / 1000;

		// 2- Extract minutes:
		var minutes = parseInt(seconds / 60, 10); // 60 seconds in 1 minute

		// 3- Keep only seconds not extracted to minutes:
		seconds = seconds % 60;

		var len = seconds.toString().length;
		if (len < 2) {
			seconds = "0" + seconds;
		}
		return minutes + ":" + seconds;
	}

	function timerCountDown(context) {
		// var refreshTime = 60000;
		var refreshTime = 900000;
		var timerFragment = sap.ui.xmlfragment("timerFrag",
			"zdashboardgcial.zdashboardgcial.view.fragment.Timer",
			context.getView().getController() // associate controller with the fragment            
		);
		var timerLabel = context.getView().addDependent(timerFragment);

		setInterval(function () {
			timerLabel.byId("timer").setText(msToHMS(refreshTime));
			refreshTime -= 1000;
			if (refreshTime === 0) {
				// refreshTime = 60000;
				refreshTime = 900000;
				if (firstDisplay) {
					context.getFilters();
					console.log("Consulta al backend OK");
				}

			}
		}, 1000); //1 S.
	}

	return Controller.extend("zdashboardgcial.zdashboardgcial.controller.Main", {
		onInit: function () {
			var that = this;
			timerCountDown(that);
		},
		onPressFilter: function (oEvent) {

			var oTableSelectDialog, oDeferred = new jQuery.Deferred(),
				that = this;

			BusyIndicator.show();

			if (!this._ControllerSelectDialog) {
				this._ControllerSelectDialog = {
					"deferred": null,
					"onPressCancel": function () {
						oTableSelectDialog.close();
						if (!timerFragmentText) {
							timerFragmentText = sap.ui.xmlfragment("FilterText",
								"zdashboardgcial.zdashboardgcial.view.fragment.Timer",
								that.getView().getController() // associate controller with the fragment            
							);
						}
						var timerLabel = that.getView().addDependent(timerFragmentText);
						timerLabel.byId("Centro").setText("");
						timerLabel.byId("FechaDesde").setText("");
						timerLabel.byId("FechaHasta").setText("");
					},
					"onPressFilter": function (oPressEvent) {
						that.getFilters();
						oTableSelectDialog.close();
					}
				};
			}

			this._ControllerSelectDialog.deferred = oDeferred;

			if (!this._DialogSelectValue) {
				this._DialogSelectValue = sap.ui.xmlfragment("zdashboardgcial.zdashboardgcial.view.fragment.AddFilter", this._ControllerSelectDialog);
				if (this.getView()) this.getView().addAssociation(this._DialogSelectValue);
			}

			oTableSelectDialog = this._DialogSelectValue;
			models.load("Model_Filter", {
				"rowsFilter": {
					"Centro": "",
					"FechaDesde": "",
					"FechaHasta": ""
				}
			});

			oTableSelectDialog.setModel(models.get("Model_Filter"));
			this.getView().addDependent(oTableSelectDialog);
			BusyIndicator.hide();
			oTableSelectDialog.open();
		},

		getFilters: function () {

			var that = this,
				filterObject = models.get("Model_Filter").getProperty("/rowsFilter");

			var dictionary = {
				TiempoCiclo: {
					path: "/tiempoCicloSet",
					model: "/rowsTiempoCiclo",
					frameId: "vizFrameTiempoCiclo",
					title: "Tiempo Ciclo",
					dataPointStyle: "",
					colorPalette: "#5899DA",
					popOver: "popOverTiempoCiclo",
					customPopOver: false,
					popOverPath: ""
				},
				MetaDespacho: {
					path: "/metaDespachoSet",
					model: "/rowsMetaDespacho",
					frameId: "vizFrameMetaDespacho",
					title: "Meta de Despacho",
					dataPointStyle: vizConfig.getMetaDespachoDataPointStyle(),
					colorPalette: "",
					popOver: "popOverMetaDespacho",
					customPopOver: false,
					popOverPath: ""
				},
				CapacidadOciosa: {
					path: "/capacidadOciosaSet",
					model: "/rowsCapacidadOciosa",
					frameId: "vizFrameCapacidadOciosa",
					title: "Capacidad Ociosa Tiempo",
					dataPointStyle: "",
					colorPalette: "#945ECF",
					popOver: "popOverCapacidadOciosa",
					customPopOver: false,
					popOverPath: ""
				},
				CapacidadOciosaTon: {
					path: "/capacidadOciosaTonSet",
					model: "/rowsCapacidadOciosaTon",
					frameId: "vizFrameCapacidadOciosaTon",
					title: "Capacidad Ociosa Toneladas",
					dataPointStyle: vizConfig.getCapacidadOciosaTonDataPointStyle(),
					colorPalette: "",
					popOver: "popOverCapacidadOciosaTon",
					customPopOver: false,
					popOverPath: ""
				},
				AlistadoTransportes: {
					path: "/alistadoQuantitySet",
					model: "/rowsAlistadoTransportes",
					frameId: "vizFrameAlistadoTransportes",
					title: "Alistado Plan Carga",
					dataPointStyle: "",
					colorPalette: ["#3fa45b", "#ffde08", "#dc0d0e"],
					popOver: "popOverAlistadoTransportes",
					customPopOver: true,
					popOverPath: "/alistadoTransportesSet"
				}
			};

			BusyIndicator.show();
			console.log(filterObject);
			var centro = new sap.ui.model.Filter({
				path: "Centro",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: filterObject.Centro
			});

			var fechaDesde = new sap.ui.model.Filter({
				path: "FechaDesde",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: filterObject.FechaDesde
			});

			var fechaHasta = new sap.ui.model.Filter({
				path: "FechaHasta",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: filterObject.FechaHasta
			});

			generateVizFrame(dictionary.TiempoCiclo, that, centro, fechaDesde, fechaHasta);
			generateVizFrame(dictionary.MetaDespacho, that, centro, fechaDesde, fechaHasta);
			generateVizFrame(dictionary.AlistadoTransportes, that, centro, fechaDesde, fechaHasta);
			generateVizFrame(dictionary.CapacidadOciosa, that, centro, fechaDesde, fechaHasta);

			// In order to calculate the total Kilos, it is necessary to perform this READ to DB 
			gateway.read(mainService, dictionary.CapacidadOciosaTon.path, {
					"filters": [centro, fechaDesde, fechaHasta]
				})
				.then(function (res) {
					var responseSet = res.results;
					dictionary.CapacidadOciosaTon.dataPointStyle = vizConfig.setCapacidadOciosaTonDisplayName(responseSet);
					generateVizFrame(dictionary.CapacidadOciosaTon, that, centro, fechaDesde, fechaHasta);
				});

			if (!firstDisplay) firstDisplay = true;

			if (!timerFragmentText) {
				timerFragmentText = sap.ui.xmlfragment("FilterText",
					"zdashboardgcial.zdashboardgcial.view.fragment.Timer",
					that.getView().getController() // associate controller with the fragment            
				);
			}
			var timerLabel = that.getView().addDependent(timerFragmentText);
			timerLabel.byId("Centro").setText(filterObject.Centro);
			timerLabel.byId("FechaDesde").setText(filterObject.FechaDesde);
			timerLabel.byId("FechaHasta").setText(filterObject.FechaHasta);

		},
		i18nText: function (sId) {
			return models.get("i18n").getProperty(sId);
		},
		onAfterRendering: function () {
			this.onPressFilter();
		},
		onBeforeRendering: function () {
			if (!models.exists("Model_Main")) {
				models.load("Model_Main", {
					"rowsTiempoCiclo": [],
					"rowsMetaDespacho": [],
					"rowsCapacidadOciosa": [],
					"rowsCapacidadOciosaTon": [],
					"rowsAlistadoTransportes": [],
					"enabledLoad": true
				});
			}
			this.getView().byId("dynamicPageId").setModel(models.get("Model_Main"));
		}
	});
});