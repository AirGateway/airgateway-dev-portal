/******************/
/*    DASHBOARD   */
/******************/
$dashboardContainer = $('#dashboard-panel');
$dashboardInnerContainer = $('#dashboard-panel-inner');

var plans = [];

if ($dashboardContainer.length) {
    var tplDashboardPlan = underscore.template($('#tpl_dashboard_plan').html());
    var tplDashboardPlanSelect = underscore.template($('#tpl_dashboard_plan_select').html());

    $.signedAjax({
        url: host + urlMap.plans,
        success: function (response) {
            for (var i in response.data) {
                if (response.data[i].status == 'active') {
                    plans.push(response.data[i]);
                }
            }

            renderPlanSelect();
        }
    });

    function renderPlanSelect() {
        if (plans.length) {
            $dashboardContainer.prepend(tplDashboardPlanSelect({
                plans: plans
            }));

            showPlan(plans[0].id);
        }
    }

    function showPlan(planID) {
        for (var i in plans) {
            if (plans[i].id === planID) {

                $dashboardInnerContainer.html(tplDashboardPlan({
                    id: plans[i].id,
                    name: plans[i].name,
                    short_description: plans[i].short_description,
                    rate: plans[i].rate,
                    per: plans[i].per,
                    quota_max: plans[i].quota_max,
                    quota_renewal_rate: plans[i].quota_renewal_rate,
                    url: plans[i].url,
                    auth_header: plans[i].auth_header,
                    key: plans[i].key
                }));

                generateChartForKey(planID, planID, true);
                generateChartForKey(planID, planID + "-method-breakdown-canvas", false);
                generateMeanResponseTimeChart(planID, planID + "-method-breakdown-meantime-canvas");
                generatePieChartForKey(planID, planID + "-method-breakdown-pie-canvas");
                generateLookToBookRatioChart(planID, planID + "-look-to-book-ratio-canvas");
                generateLookToBookLimitReachedChart(planID, planID + "-look-to-book-line-canvas");

                //generateChartForParticipants(planID, planID + "-aggregator", true);
                //generateChartForParticipants(planID, planID + "-agency", false);
            }
        }
    }
}