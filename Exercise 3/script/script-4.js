//Define a tree layout

var margin = {t:100,l:100,b:100,r:100},
    width = $('.canvas').width()-margin.l-margin.r,
    height = $('.canvas').height()-margin.t-margin.b;

var svg = d3.select('.canvas')
    .append('svg')
    .attr('width',width+margin.l+margin.r)
    .attr('height',height+margin.t+margin.b)
    .append('g')
    .attr('transform',"translate("+margin.l+","+margin.t+")");

var force = d3.layout.force()
    .size([width,height])
    .friction(0.7) //velocity decay
    .gravity(0.05) //
    .charge(function(d){
        if(!d.children){return -20;}
        else{return -100}
        }) //negative value => repulsion
    .linkDistance(50) //weak geometric constraint
    .linkStrength(0.1)
    ;

//Tree layout
var tree = d3.layout.tree()
    .size([width,height])
    .children(function(d){
        return d.values;
    })
    .value(function(d){
        return d.pop;
    });

//Scales
var scaleSize = d3.scale.sqrt().domain([0,1e9]).range([2,20]);


queue()
    .defer(d3.csv, 'data/world.csv', parse)
    .await(function(err, data){

        //create hierarchy out of data
        var continents = d3.nest()
            .key(function(d){ return d.continent; })
            .entries(data);

        var world = {
            key:"world",
            values:continents
        };

        draw(world);

    });

function draw(root){
    var nodesArray = tree(root);
    var linksArray = tree.links(nodesArray);

    console.log(nodesArray);
    console.log(linksArray);

    var nodes = svg.selectAll('.node')
        .data(nodesArray, function(d){return d.key; });
    var nodesEnter = nodes.enter()
        .append('g')
        .attr('class','node')
        .filter(function(d){
            return d.depth>1;
        });
    nodesEnter
        .append('circle')
        .attr('r',function(d){
            return scaleSize(d.value);
        });
    nodes
        .attr('transform',function(d){
            return 'translate('+ d.x+','+ d.y+')';
        })
        //.on('mouseenter',function(d){d.fixed = true;})

    var velocity = svg.selectAll('.velocity')
        .data(nodesArray)
        .enter()
        .append('line')
        .attr('class','velocity');

    var links = svg.selectAll('.link')
        .data(linksArray, function(d){return d.target.key;});
    links.enter()
        .insert('line','.node')
        .attr('class','link');
    links
        .attr('x1',function(d){return d.source.x;})
        .attr('y1',function(d){return d.source.y;})
        .attr('x2',function(d){return d.target.x;})
        .attr('y2',function(d){return d.target.y;});

    force
        .nodes(nodesArray)
        .links(linksArray)
        .on('tick',onTick)
        .start();

    nodes.call(force.drag);

    function onTick(e){
        nodes
            .attr('transform',function(d){
                return 'translate('+ d.x+','+ d.y+')';
            });
        velocity
            .attr('x1',function(d){return d.x;})
            .attr('y1',function(d){return d.y;})
            .attr('x2',function(d){return d.px;})
            .attr('y2',function(d){return d.py;});
        links
            .attr('x1',function(d){return d.source.x;})
            .attr('y1',function(d){return d.source.y;})
            .attr('x2',function(d){return d.target.x;})
            .attr('y2',function(d){return d.target.y;});
    }

}

function parse(d){
    if(!d.UNc_latitude || !d.UNc_longitude || !d.population){
        return;
    }

    return {
        key: d.ISO3166A3,
        name: d.ISOen_name,
        lngLat:[+d.UNc_longitude, +d.UNc_latitude],
        continent: d.continent,
        pop: +d.population>0?+d.population:0
    }
}


