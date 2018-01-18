/****************/
/*    COMMON    */
/****************/

/*String.prototype.toUnderscore = function () {
    return this.replace(/([A-Z])/g, function ($1) {
        return "_" + $1.toLowerCase();
    });
};*/

function nl2br(text) {
    return text.replace(/([^>])\n/g, '$1<br/>');
};

$.signedAjax = function (data) {
    data = data || {};
    data.headers = data.headers || {};
    data.headers['Ag-Auth-Dev'] = localStorage.token;

    $.ajax(data);
};
var host = location.host.indexOf('localhost') == -1 ? 'https://airline-proxy.com/api/' : 'http://localhost:3001';
var urlMap = {
    login: '/auth/login',
    signup: '/auth/signup',
    fields: '/auth/signup-fields',
    graph: '',
    profile: '/portal/profile',
    plans: '/portal/plans',
    plansMessage: '/portal/plans-message',
    requestKey: '/portal/request-key/',
    invalidateKey: '/portal/invalidate-key/',
    requestFields: '/portal/request-key-fields',
    form: '/portal/form',
    /* messaging */
    chat: '/portal/chat/',
    newMessages: '/portal/chat/new-messages',
    document: '/portal/documents/',
    /* stats */
    requestStats: '/portal/stats/request/',
    breakdownStats: '/portal/stats/breakdown/',
    meantimeStats: '/portal/stats/meantime/',
    aggregatorStats: '/portal/stats/aggregator/',
    agencyStats: '/portal/stats/agency/',
};
var tplInput = underscore.template($('#tpl_input').html());
var tplMenu = underscore.template($('#tpl_menu').html());
var tplHiddenInput = underscore.template($('#tpl_hidden_input').html());


//initialization
$(function () {
    //1. render dynamic part of layout template
    $('.nav .container').append(tplMenu());

    //2. check messages count

    if (localStorage.token) {
        checkNewMessages();

        setInterval(function () {
            checkNewMessages()
        }, 1000 * 30);
    }
});

function checkNewMessages() {
    $.signedAjax({
        url: host + urlMap.newMessages,
        success: function (response) {
            if (response.status === 'OK' && parseInt(response.meta) > 0) {
                $('.chat-counter').html('(' + response.meta + ')')
            }
        }
    });
}

$summaryErrors = $('.error-summary');
$successFormPanel = $('.success-form');

function resetFormErrors() {
    $summaryErrors.hide();
}

function showFormErrors(errors) {
    $panel = $summaryErrors.find('.panel-body');
    $panel.html('');

    var errorKeys = Object.keys(errors);
    for (var i in errorKeys) {
        var k = errorKeys[i];
        $panel.append(k + ': ' + errors[k] + '<br>');
    }

    $summaryErrors.show();
}

function showFormSuccess() {
    $successFormPanel.show();
    $(window).scrollTop(0, 0);

}



/******************/
/* OTHER HANDLERS */
/******************/

$(document).on('click', '#logout', function (e) {
    e.preventDefault();
    delete localStorage.token;
    location.href = '/';
});


function getColorFromBase(baseColor, transparency, number) {
    var color = 'hsla(';

    color += baseColor;
    color += number + '%, ';

    color += transparency;
    color += ')';

    return color;
}

function getDataSet(label, baseColor, number, highlightColor) {
    var set = {
        label: label,
        fillColor: getColorFromBase(baseColor, '0.2', number),
        strokeColor: getColorFromBase(baseColor, '1', number),
        pointColor: getColorFromBase(baseColor, '1', number),
        pointStrokeColor: highlightColor,
        pointHighlightFill: highlightColor,
        pointHighlightStroke: getColorFromBase(baseColor, '1', number),
        data: []
    };

    return set;
}

function sortByKey(array, key) {
    return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

var chartOptions = {
    ///Boolean - Whether grid lines are shown across the chart
    scaleShowGridLines: true,
    //String - Colour of the grid lines
    scaleGridLineColor: "rgba(0,0,0,.05)",
    //Number - Width of the grid lines
    scaleGridLineWidth: 1,
    //Boolean - Whether to show horizontal lines (except X axis)
    scaleShowHorizontalLines: true,
    //Boolean - Whether to show vertical lines (except Y axis)
    scaleShowVerticalLines: true,
    //Boolean - Whether the line is curved between points
    bezierCurve: true,
    //Number - Tension of the bezier curve between points
    bezierCurveTension: 0.4,
    //Boolean - Whether to show a dot for each point
    pointDot: true,
    //Number - Radius of each point dot in pixels
    pointDotRadius: 4,
    //Number - Pixel width of point dot stroke
    pointDotStrokeWidth: 1,
    //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
    pointHitDetectionRadius: 20,
    //Boolean - Whether to show a stroke for datasets
    datasetStroke: true,
    //Number - Pixel width of dataset stroke
    datasetStrokeWidth: 2,
    //Boolean - Whether to fill the dataset with a colour
    datasetFill: true,
    //String - A legend template
    legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
    tooltipTemplate: "<%= datasetLabel %> - <%= value %>",
    multiTooltipTemplate: "<%= datasetLabel %> - <%= value %>"
};

var pieChartOptions = {
    cutoutPercentage: 0,
    rotation: 0
};

var typesOfRequests = [
    'AirDocIssueRQ',
    'AirShoppingRQ',
    'BaggageAllowanceRQ',
    'FlightPriceRQ',
    'ItinReshopRQ',
    'OrderCancelRQ',
    'OrderCreateRQ',
    'OrderRetrieveRQ',
    'SeatAvailabilityRQ'
];


var generateChartForKey = function (planID, canvasID, showRequests) {
    var now = new Date();
    now.setDate(now.getDate() + 1);
    var fixedNowMonth = now.getMonth() + 1;

    var then = new Date();
    then.setDate(then.getDate() - 7);
    var fixedThenMonth = then.getMonth() + 1;


    var url = urlMap.breakdownStats + planID;

    if (showRequests) {
        url = urlMap.requestStats + planID;
    }

    $.signedAjax({
        url: host + url,
        success: function (data) {
            var highlightColor = "#fff";

            var baseColor = '217, 100%, '; //#00245D

            var cData = {
                labels: [],
                datasets: [
                    getDataSet('Success', baseColor, 47, highlightColor),
                    getDataSet('Errors', baseColor, 30, highlightColor),
                    getDataSet('AirShopping', baseColor, 10, highlightColor),
                    getDataSet('FlightPrice', baseColor, 70, highlightColor),
                    getDataSet('SeatAvailability', baseColor, 80, highlightColor),
                    getDataSet('BaggageAllowance', baseColor, 40, highlightColor),
                    getDataSet('ItinReshop', baseColor, 30, highlightColor),
                    getDataSet('OrderCreate', baseColor, 50, highlightColor),
                    getDataSet('OrderCancel', baseColor, 0, highlightColor),
                    getDataSet('OrderRetrieve', baseColor, 5, highlightColor),

                    getDataSet('Other', baseColor, 90, highlightColor)
                ]
            };

            //var jsonData = JSON.parse(data);
            var jsonData = data;
            var noData = true;
            var sortMe = [];

            for (var i in jsonData.data) {
                var thisDate = new Date(jsonData.data[i].id.time);
                var l = thisDate.getHours() + ':00';
                var success = jsonData.data[i].success;
                var errors = jsonData.data[i].error;
                var hits = jsonData.data[i].hits;

                var obj = {
                    d: thisDate,
                    label: l,
                    success: success,
                    errors: errors
                };

                if (!showRequests) {
                    var airShoppingRQs = jsonData.data[i].AirShoppingRQ || 0;
                    var flightPriceRQs = jsonData.data[i].FlightPriceRQ || 0;
                    var seatAvailabilityRQs = jsonData.data[i].SeatAvailabilityRQ || 0;
                    var baggageAllowanceRQs = jsonData.data[i].BaggageAllowanceRQ || 0;
                    var itinReshopRQs = jsonData.data[i].ItinReshopRQ || 0;
                    var orderCreateRQs = jsonData.data[i].OrderCreateRQ || 0;
                    var orderCancelRQs = jsonData.data[i].OrderCancelRQ || 0;
                    var orderRetrieveRQs = jsonData.data[i].OrderRetrieveRQ || 0;

                    var obj = {
                        d: thisDate,
                        label: l,
                        success: success,
                        errors: errors,
                        airShoppingRQs: airShoppingRQs,
                        flightPriceRQs: flightPriceRQs,
                        seatAvailabilityRQs: seatAvailabilityRQs,
                        baggageAllowanceRQs: baggageAllowanceRQs,
                        itinReshopRQs: itinReshopRQs,
                        orderCreateRQs: orderCreateRQs,
                        orderCancelRQs: orderCancelRQs,
                        orderRetrieveRQs: orderRetrieveRQs
                    }
                }
                if (hits > 0) {
                    noData = false
                }
                sortMe.push(obj)
            }

            fixedData = sortByKey(sortMe, "d");

            if (!showRequests) {
                for (var i in fixedData) {
                    cData.labels.push(fixedData[i].label);
                    cData.datasets[2].data.push(fixedData[i].airShoppingRQs);
                    cData.datasets[3].data.push(fixedData[i].flightPriceRQs);
                    cData.datasets[4].data.push(fixedData[i].seatAvailabilityRQs);
                    cData.datasets[5].data.push(fixedData[i].baggageAllowanceRQs);
                    cData.datasets[6].data.push(fixedData[i].itinReshopRQs);
                    cData.datasets[7].data.push(fixedData[i].orderCreateRQs);
                    cData.datasets[8].data.push(fixedData[i].orderCancelRQs);
                    cData.datasets[9].data.push(fixedData[i].orderRetrieveRQs)
                }
            } else {
                for (var i in fixedData) {
                    cData.labels.push(fixedData[i].label);
                    cData.datasets[0].data.push(fixedData[i].success);
                    cData.datasets[1].data.push(fixedData[i].errors)
                }
            }

            if (noData == true) {
                var ctx = $("#" + canvasID).get(0).getContext("2d");
                ctx.font = '20px Lato';
                ctx.textAlign = 'center';
                ctx.fillText('No Available Data', 400, 100);
            } else {
                var ctx = $("#" + canvasID).get(0).getContext("2d");
                var myNewChart = new Chart(ctx).Line(cData, chartOptions);
            }
        },
        error: function (result) {
            if (result.status == 401) {
                $('#logout').click();
            }
        }
    });
};

var generatePieChartForKey = function (planID, canvasID) {
    var now = new Date();
    now.setDate(now.getDate() + 1);
    var fixedNowMonth = now.getMonth() + 1;

    var then = new Date();
    then.setDate(then.getDate() - 7);
    var fixedThenMonth = then.getMonth() + 1;

    var url = urlMap.breakdownStats + planID;
    $.signedAjax({
        url: host + url,
        success: function (data) {
            //$.getJSON("/json-original.json", function(data) {
            var baseColor = '217, 100%, '; //#00245D

            //var jsonData = JSON.parse(data);
            var jsonData = data;

            var sortMe = [];
            var airShoppingRQs = 0;
            var flightPriceRQs = 0;
            var seatAvailabilityRQs = 0;
            var baggageAllowanceRQs = 0;
            var itinReshopRQs = 0;
            var orderCreateRQs = 0;
            var orderCancelRQs = 0;
            var orderRetrieveRQs = 0;

            for (var i in jsonData.data) {
                airShoppingRQs += jsonData.data[i].AirShoppingRQ || 0;
                flightPriceRQs += jsonData.data[i].FlightPriceRQ || 0;
                seatAvailabilityRQs += jsonData.data[i].SeatAvailabilityRQ || 0;
                baggageAllowanceRQs += jsonData.data[i].BaggageAllowanceRQ || 0;
                itinReshopRQs += jsonData.data[i].ItinReshopRQ || 0;
                orderCreateRQs += jsonData.data[i].OrderCreateRQ || 0;
                orderCancelRQs += jsonData.data[i].OrderCancelRQ || 0;
                orderRetrieveRQs += jsonData.data[i].OrderRetrieveRQ || 0;
            }

            var noData = false;

            if (airShoppingRQs == 0 && flightPriceRQs == 0 && seatAvailabilityRQs == 0 && baggageAllowanceRQs == 0 && itinReshopRQs == 0 && orderCreateRQs == 0 && orderCancelRQs == 0 && orderRetrieveRQs == 0) {
                noData = true;
            }

            if (noData) {
                var ctx = $("#" + canvasID).get(0).getContext("2d");
                ctx.font = "20px Lato";
                ctx.textAlign = "center";
                ctx.fillText("No Available Data", 400, 100);
            } else {
                var pieData = [
                    {
                        value: airShoppingRQs,
                        color: getColorFromBase(baseColor, '1', '10'),
                        highlightColor: getColorFromBase(baseColor, '1', '15'),
                        label: "AirShopping"
                    },
                    {
                        value: flightPriceRQs,
                        color: getColorFromBase(baseColor, '1', '70'),
                        highlightColor: getColorFromBase(baseColor, '1', '75'),
                        label: "FlightPrice"
                    },
                    {
                        value: seatAvailabilityRQs,
                        color: getColorFromBase(baseColor, '1', '80'),
                        highlightColor: getColorFromBase(baseColor, '1', '85'),
                        label: "SeatAvailability"
                    },
                    {
                        value: baggageAllowanceRQs,
                        color: getColorFromBase(baseColor, '1', '40'),
                        highlightColor: getColorFromBase(baseColor, '1', '45'),
                        label: "BaggageAllowance"
                    },
                    {
                        value: itinReshopRQs,
                        color: getColorFromBase(baseColor, '1', '30'),
                        highlightColor: getColorFromBase(baseColor, '1', '35'),
                        label: "ItinReshop"
                    },
                    {
                        value: orderCreateRQs,
                        color: getColorFromBase(baseColor, '1', '50'),
                        highlightColor: getColorFromBase(baseColor, '1', '55'),
                        label: "OrderCreate"
                    },
                    {
                        value: orderCancelRQs,
                        color: getColorFromBase(baseColor, '1', '0'),
                        highlightColor: getColorFromBase(baseColor, '1', '5'),
                        label: "OrderCancel"
                    },
                    {
                        value: orderRetrieveRQs,
                        color: getColorFromBase(baseColor, '1', '5'),
                        highlightColor: getColorFromBase(baseColor, '1', '8'),
                        label: "OrderRetrieve"
                    }
                ];

                var ctx = $("#" + canvasID).get(0).getContext("2d");
                var pieChart = new Chart(ctx).Doughnut(pieData);
            }
        },
        error: function (result) {
            if (result.status == 401) {
                $('#logout').click();
            }
        }
    })
};


var generateMeanResponseTimeChart = function (planID, canvasID) {
    var url = urlMap.meantimeStats + planID;
    $.signedAjax({
        url: host + url,
        success: function (response) {
            var highlightColor = '#fff';
            var baseColor = '217, 100%, '; //#00245D

            var cData = {
                labels: [],
                datasets: [
                    getDataSet('Requests', baseColor, 47, highlightColor),
                    getDataSet('Errors', baseColor, 30, highlightColor),
                    getDataSet('AirShopping', baseColor, 10, highlightColor),
                    getDataSet('FlightPrice', baseColor, 70, highlightColor),
                    getDataSet('SeatAvailability', baseColor, 80, highlightColor),
                    getDataSet('BaggageAllowance', baseColor, 40, highlightColor),
                    getDataSet('ItinReshop', baseColor, 30, highlightColor),
                    getDataSet('OrderCreate', baseColor, 50, highlightColor),
                    getDataSet('OrderCancel', baseColor, 0, highlightColor),
                    getDataSet('OrderRetrieve', baseColor, 5, highlightColor),
                    getDataSet('Other', baseColor, 90, highlightColor)
                ]
            };


            var sortMe = [];
            var noData = false;

            if (response.data == null) {
                noData = true;
            } else {
                noData = true;
                for (var i in response.data) {
                    var thisDate = new Date(response.data[i].id.time);
                    var l = thisDate.getHours() + ':00';
                    var hits = response.data[i].hits;
                    var errors = response.data[i].error;

                    var obj;

                    any = {
                        d: thisDate,
                        label: l
                    };

                    var airShoppingRQs = response.data[i].AirShoppingRQ || 0;
                    var flightPriceRQs = response.data[i].FlightPriceRQ || 0;
                    var seatAvailabilityRQs = response.data[i].SeatAvailabilityRQ || 0;
                    var baggageAllowanceRQs = response.data[i].BaggageAllowanceRQ || 0;
                    var itinReshopRQs = response.data[i].ItinReshopRQ || 0;
                    var orderCreateRQs = response.data[i].OrderCreateRQ || 0;
                    var orderCancelRQs = response.data[i].OrderCancelRQ || 0;
                    var orderRetrieveRQs = response.data[i].OrderRetrieveRQ || 0;

                    obj = {
                        d: thisDate,
                        label: l,
                        airShoppingRQs: airShoppingRQs,
                        flightPriceRQs: flightPriceRQs,
                        seatAvailabilityRQs: seatAvailabilityRQs,
                        baggageAllowanceRQs: baggageAllowanceRQs,
                        itinReshopRQs: itinReshopRQs,
                        orderCreateRQs: orderCreateRQs,
                        orderCancelRQs: orderCancelRQs,
                        orderRetrieveRQs: orderRetrieveRQs
                    };

                    if (airShoppingRQs || flightPriceRQs || seatAvailabilityRQs || baggageAllowanceRQs || itinReshopRQs || orderCreateRQs || orderCancelRQs || orderRetrieveRQs) {
                        noData = false;
                    }


                    sortMe.push(obj)
                }
            }

            var fixedData = sortByKey(sortMe, 'd');

            for (var i in fixedData) {
                cData.labels.push(fixedData[i].label);
                cData.datasets[2].data.push(fixedData[i].airShoppingRQs);
                cData.datasets[3].data.push(fixedData[i].flightPriceRQs);
                cData.datasets[4].data.push(fixedData[i].seatAvailabilityRQs);
                cData.datasets[5].data.push(fixedData[i].baggageAllowanceRQs);
                cData.datasets[6].data.push(fixedData[i].itinReshopRQs);
                cData.datasets[7].data.push(fixedData[i].orderCreateRQs);
                cData.datasets[8].data.push(fixedData[i].orderCancelRQs);
                cData.datasets[9].data.push(fixedData[i].orderRetrieveRQs)
            }

            var ctx = $("#" + canvasID).get(0).getContext("2d");

            if (noData == true) {
                ctx.font = '20px Lato';
                ctx.textAlign = 'center';
                ctx.fillText('No Available Data', 400, 100);
            } else {
                var myNewChart = new Chart(ctx).Line(cData, chartOptions);
            }
        }
    });
}

var colors = [47, 30, 10, 70, 80, 30, 50, 0, 5, 90];

/*var generateChartForParticipants = function (keyId, canvasID, isAggregator) {
    var now = new Date();
    now.setDate(now.getDate() + 1);
    var fixedNowMonth = now.getMonth() + 1;

    var then = new Date();
    then.setDate(then.getDate() - 7);
    var fixedThenMonth = then.getMonth() + 1;


    var promise;


    if (isAggregator) {
        var url = urlMap.aggregatorStats + keyId;
    } else {
        var url = urlMap.agencyStats + keyId;
    }

    $.signedAjax({
        url: host + url,
        success: function (response) {
            var highlightColor = '#fff';

            var baseColor = '217, 100%, '; //#00245D

            var cData;
            if (isAggregator) {
                chartDataAggregator[keyId] = {
                    labels: [],
                    datasets: []
                };

                cData = chartDataAggregator[keyId]
            } else {
                chartDataAgency[keyId] = {
                    labels: [],
                    datasets: []
                };
                cData = chartDataAgency[keyId]
            }

            var i = 0;
            var elements = [];
            for (var name in response.data[0].items) {
                elements.push(name);
                if (colors.length == i) {
                    i = 0
                }
                cData.datasets.push(getDataSet(name, baseColor, colors[i], highlightColor));
                i++;
            }
            if (isAggregator) {
                aggregatorElements[keyId] = elements;
            } else {
                agencyElements[keyId] = elements;
            }
            //var jsonData = JSON.parse(data);
            var jsonData = response;

            var sortMe = [];
            var noData = true;

            if (jsonData.data != null) {
                for (var i in jsonData.data) {
                    var thisDate = new Date(jsonData.data[i].id.time);
                    var l = thisDate.getHours() + ':00';
                    var hits = jsonData.data[i].hits;

                    var obj = {
                        d: thisDate,
                        label: l
                    };

                    for (var j in elements) {
                        obj[elements[j]] = jsonData.data[i].items[elements[j]] || 0;
                    }

                    if (hits > 0) {
                        noData = false;
                    }
                    sortMe.push(obj)
                }
            }

            var fixedData = sortByKey(sortMe, 'd');
            for (var i in fixedData) {
                cData.labels.push(fixedData[i].label);
                for (var j in elements) {
                    cData.datasets[j].data.push(fixedData[i][elements[j]]);
                }
            }
            if (noData == true) {
                var ctx = $("#" + canvasID).get(0).getContext("2d");
                ctx.font = '20px Lato';
                ctx.textAlign = 'center';
                ctx.fillText('No Available Data', 400, 100);
            } else {
                var ctx = $("#" + canvasID).get(0).getContext("2d");
                var myNewChart = new Chart(ctx).Line(cData, chartOptions);
            }

            reloadSelects(keyId, isAggregator);
        }
    });
};

var chartDataAggregator = [];
var chartDataAgency = [];
var aggregatorElements = [];
var agencyElements = [];

function reloadSelects(keyId, isAggregator) {
    var select = $('.' + keyId + (isAggregator ? '-aggregatorSelect' : '-agencySelect'));
    elements = isAggregator ? aggregatorElements[keyId] : agencyElements[keyId];
    for (var i in elements) {
        select.append('<option value="' + elements[i] + '">' + elements[i] + '</option>')
    }

}

function reloadAggregatorChart(keyId, value) {
    var data = JSON.parse(JSON.stringify(chartDataAggregator[keyId]));
    if (value) {
        var newDatasets = [];
        for (var i in data.datasets) {
            if (data.datasets[i].label == value) {
                newDatasets = [data.datasets[i]];
                break;
            }
        }
        data.datasets = newDatasets;
    }

    var ctx = $("#" + keyId + '-aggregator').get(0).getContext("2d");
    var myNewChart = new Chart(ctx).Line(data, chartOptions);
}

function reloadAgencyChart(keyId, value) {
    var data = JSON.parse(JSON.stringify(chartDataAgency[keyId]));
    if (value) {
        var newDatasets = [];
        for (var i in data.datasets) {
            if (data.datasets[i].label == value) {
                newDatasets = [data.datasets[i]];
                break;
            }
        }
        data.datasets = newDatasets;
    }

    var ctx = $("#" + keyId + '-agency').get(0).getContext("2d");
    var myNewChart = new Chart(ctx).Line(data, chartOptions);
}*/
