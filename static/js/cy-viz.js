$(document).ready(function () {
    // Parse galaxy url from attribute in cy element
    var url = $("#cy").attr("data-galaxyurl");

    // Load data using HTTP GET request
    var wf = $.ajax({
        url: '/gigafig/galaxy2cytoscape/',
        type: 'GET',
        error: function (xhr, tStatus, err) {
            $('#cy').html('<p>Problem converting galaxy workflow</p><p>HTTP status: ' + xhr.status + '</p><p>' + tStatus + '</p><p>' + err + '</p>');
        },
        dataType: 'json',
        data: {
            galaxy_wf_json_url: url
        }
    });

    function dataPanelHtml(node_title, content) {
        return '<div class="panel panel-default panel-warning">\
                                        <div class="panel-heading">\
                                        <h3 class="panel-title">' + node_title + '</h3></div>\
                                        <div class="panel-body">' + content + '</div>\
                                        </div>';

    }

    function toolPanelHtml(node_title, content) {
        return '<div class="panel panel-default panel-info">\
                                        <div class="panel-heading">\
                                        <h3 class="panel-title">' + node_title + '</h3></div>\
                                        <div class="panel-body">' + content + '</div>\
                                        </div>';

    }

    function outputPanelHtml(node_title, content) {
        return '<div class="panel panel-default panel-success">\
                                        <div class="panel-heading">\
                                        <h3 class="panel-title">' + node_title + '</h3></div>\
                                        <div class="panel-body">' + content + '</div>\
                                        </div>';

    }

    // When workflow is loaded, init cy
    Promise.all([wf]).then(initCy);

    function initCy(then) {
        var loading = document.getElementById('loading');
        loading.classList.add('loaded');

        var expJson = then[0];
        var elements = expJson.elements;

        // Copy tool params into tab panels
        var nodes = elements.nodes;
        var htmlString = "";
        var count = 1;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].data.type == "tool") {
                //Parse tool state information
                var state = nodes[i].data.tool_state;
                var params = '<table class="table">';
                for (var prop in state) {
                    // Check if parameter is a nested array
                    if(prop !== "__page__" && prop !== "chromInfo" && prop !== "__rerun_remap_job_id__") {
                        var param = JSON.parse(state[prop]);
                        if(param instanceof Object) {
                            var subtable = '<table class="table">';

                            for (var item in param) {
                                subtable += "<tr><td>" + item + "</td>";
                                subtable += "<td>" + param[item] + "</td></tr>";
                            }
                            subtable += "</table>";

                            params += '<tr data-toggle="collapse" data-target="#demo' + count + '" class="accordion-toggle"><td>' + prop + '</td><td><button class="btn btn-default btn-xs"><span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span></button></td></tr>';
                            params += '<tr><td class="hiddenRow"><div class="accordion-body collapse" id="demo' +  count + '">' + subtable + '</div></td></tr>';
                            count = count + 1
                            //alert(params);
                        }
                        else {
                            params += "<tr><td>" + prop + "</td>";
                            params += "<td>" + state[prop] + "</td></tr>";
                        }
                    }
                }
                params += '</table>';
                htmlString += toolPanelHtml(nodes[i].data.name + "-" + nodes[i].data.tool_version, params);
            }
            else {
                htmlString += dataPanelHtml(nodes[i].data.name, 'stuff');
            }
        }
        $("#pane2").html(htmlString);

        // The graph
        var cy = window.cy = cytoscape({
            container: document.getElementById('cy'),
            layout: {
                name: 'dagre',
                directed: true,
                roots: '#a',
                padding: 10
                //rankDir: 'LR'
            },
            style: cytoscape.stylesheet()
                .selector('node')
                .css({
                    'content': 'data(name)',
                    'shape': 'circle',
                    'background-color': 'data(color)',
                    'font-size': 10,
                    'text-valign': 'bottom',
                    'color': '#6e6e6e'
                }
            )
                .selector('edge')
                .css({
                    'target-arrow-shape': 'triangle',
                    'width': 2,
                    'line-color': '#bfbfbf',
                    'target-arrow-color': '#bfbfbf'
                })
                .selector('.highlighted')
                .css({
                    'background-color': '#61bffc',
                    'line-color': '#61bffc',
                    'target-arrow-color': '#61bffc',
                    'transition-property': 'background-color, line-color, target-arrow-color',
                    'transition-duration': '0.5s'
                }),
            elements: elements,
            motionBlur: true,
            selectionType: 'single',
            boxSelectionEnabled: false
        });

    }

}); // on dom ready