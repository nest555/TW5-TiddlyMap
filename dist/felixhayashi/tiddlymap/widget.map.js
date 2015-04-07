/*\

title: $:/plugins/felixhayashi/tiddlymap/widget/map.js
type: application/javascript
module-type: widget

@preserve

\*/
(function(){"use strict";var e=require("$:/core/modules/widgets/widget.js").widget;var t=require("$:/plugins/felixhayashi/tiddlymap/view_abstraction.js").ViewAbstraction;var i=require("$:/plugins/felixhayashi/tiddlymap/callback_manager.js").CallbackManager;var s=require("$:/plugins/felixhayashi/tiddlymap/dialog_manager.js").DialogManager;var r=require("$:/plugins/felixhayashi/tiddlymap/utils.js").utils;var a=require("$:/plugins/felixhayashi/tiddlymap/edgetype.js").EdgeType;var n=require("$:/plugins/felixhayashi/vis/vis.js");var o=function(t,a){e.call(this);this.initialise(t,a);this.adapter=$tw.tmap.adapter;this.opt=$tw.tmap.opt;this.notify=$tw.tmap.notify;this.callbackManager=new i;this.dialogManager=new s(this.callbackManager,this);this.computeAttributes();this.objectId=this.getAttribute("object-id")?this.getAttribute("object-id"):r.genUUID();this.editorMode=this.getAttribute("editor");if(this.editorMode){r.addListeners({"tmap:tm-create-view":this.handleCreateView,"tmap:tm-rename-view":this.handleRenameView,"tmap:tm-delete-view":this.handleDeleteView,"tmap:tm-edit-view":this.handleEditView,"tmap:tm-configure-system":this.handleConfigureSystem,"tmap:tm-store-position":this.handleStorePositions,"tmap:tm-edit-filters":this.handleEditFilters,"tmap:tm-generate-widget":this.handleGenerateWidget},this,this)}r.addListeners({"tmap:tm-focus-node":this.handleFocusNode,"tmap:tm-reset-focus":this.repaintGraph},this,this)};o.prototype=Object.create(e.prototype);o.prototype.handleConnectionEvent=function(e,t){var i={fromLabel:this.adapter.selectNodeById(e.from).label,toLabel:this.adapter.selectNodeById(e.to).label};this.dialogManager.open("getEdgeType",i,function(i,s){if(i){var a=r.getText(s);var n=r.hasSubString(a,":");var o=this.getView().getConfig("edge_type_namespace");e.type=(o&&!n?o:"")+a;var d=this.adapter.insertEdge(e)}if(typeof t=="function"){t(i)}})};o.prototype.checkForFreshInstall=function(){if(r.getEntry(this.opt.ref.sysMeta,"showWelcomeMessage",true)){r.setEntry(this.opt.ref.sysMeta,"showWelcomeMessage",false);this.logger("debug","Showing welcome message");this.dialogManager.open("welcome",{dialog:{buttons:"ok"}})}};o.prototype.openStandardConfirmDialog=function(e,t){var i={message:t,dialog:{confirmButtonLabel:"Yes, proceed",cancelButtonLabel:"Cancel"}};this.dialogManager.open("getConfirmation",i,e)};o.prototype.logger=function(e,t){var i=Array.prototype.slice.call(arguments,1);i.unshift("@"+this.objectId.toUpperCase());i.unshift(e);$tw.tmap.logger.apply(this,i)};o.prototype.render=function(e,t){this.parentDomNode=e;this.registerClassNames(e);this.sidebar=document.getElementsByClassName("tc-sidebar-scrollable")[0];this.isContainedInSidebar=this.sidebar&&this.sidebar.contains(this.parentDomNode);this.viewHolderRef=this.getViewHolderRef();this.view=this.getView();this.initAndRenderEditorBar(e);this.initAndRenderGraph(e);$tw.tmap.registry.push(this);this.updateRefreshTrigger();this.checkForFreshInstall()};o.prototype.registerClassNames=function(e){if(!$tw.utils.hasClass(e,"tmap-widget")){var t=["tmap-widget"];if(r.isTrue(this.getAttribute("click-to-use"),true)){t.push("tmap-click-to-use")}if(this.getAttribute("editor")==="advanced"){t.push("tmap-advanced-editor")}if(!r.isTrue(this.getAttribute("show-buttons"),true)){t.push("tmap-no-buttons")}if(this.getAttribute("class")){t.push(this.getAttribute("class"))}$tw.utils.addClass(e,t.join(" "))}};o.prototype.initAndRenderEditorBar=function(e){this.graphBarDomNode=document.createElement("div");$tw.utils.addClass(this.graphBarDomNode,"tmap-topbar");e.appendChild(this.graphBarDomNode);this.rebuildEditorBar();this.renderChildren(this.graphBarDomNode)};o.prototype.rebuildEditorBar=function(){var e=r.flatten({param:{viewLabel:this.getView().getLabel(),isViewBound:String(this.isViewBound()),ref:{view:this.getView().getRoot(),viewHolder:this.getViewHolderRef(),edgeFilter:this.getView().getPaths().edgeFilter},allEdgesFilter:this.opt.selector.allEdgeTypes,searchOutput:"$:/temp/tmap/editor/search",nodeFilter:this.view.getNodeFilter("expression")+"+[search:title{$:/temp/tmap/editor/search}]"}});for(var t in e){this.setVariable(t,e[t])}var i={type:"tiddler",attributes:{tiddler:{type:"string",value:this.getView().getRoot()}},children:[]};if(this.editorMode==="advanced"){i.children.push({type:"transclude",attributes:{tiddler:{type:"string",value:this.opt.ref.graphBar}}})}else{i.children.push({type:"element",tag:"span",attributes:{"class":{type:"string",value:"tmap-view-label"}},children:[{type:"text",text:e["param.viewLabel"]}]})}i.children.push({type:"transclude",attributes:{tiddler:{type:"string",value:this.opt.ref.focusButton}}});this.makeChildWidgets([i])};o.prototype.refresh=function(e){this.callbackManager.handleChanges(e);var t=this.isViewSwitched(e);var i=this.getView().refresh(e);if(t||i.length){var s={resetData:true,resetOptions:true,resetFocus:true};if(t){this.logger("warn","View switched");this.view=this.getView(true)}else{this.logger("warn","View modified",i);s.resetData=false}this.rebuildGraph(s);this.updateRefreshTrigger()}else{this.checkOnGraph(e)}this.checkOnEditorBar(e,t,i)};o.prototype.updateRefreshTrigger=function(){if(this.refreshTrigger){this.callbackManager.remove(this.refreshTrigger)}this.refreshTrigger=this.getAttribute("refresh-trigger")||this.getView().getConfig("refresh-trigger");if(this.refreshTrigger){this.logger("debug","Registering refresh trigger",this.refreshTrigger);this.callbackManager.add(this.refreshTrigger,this.handleTriggeredRefresh.bind(this),false)}};o.prototype.rebuildGraph=function(e){this.logger("debug","Rebuilding graph");if(!e)e={};this.hasNetworkStabilized=false;if(e.resetData){this.graphData.edges.clear();this.graphData.nodes.clear();this.graphData.edgesById=null;this.graphData.nodesById=null}if(e.resetOptions){this.graphOptions=this.getGraphOptions();this.network.setOptions(this.graphOptions)}this.graphData=this.getGraphData(true);if(e.resetFocus&&!this.preventNextContextReset){if(typeof e.resetFocus!=="object"){e.resetFocus={delay:0,duration:0}}this.fitGraph(e.resetFocus.delay,e.resetFocus.duration);this.doZoomAfterStabilize=true;this.preventNextContextReset=false}};o.prototype.getContainer=function(){return this.parentDomNode};o.prototype.getGraphData=function(e){$tw.tmap.start("Reloading Network");if(!e&&this.graphData){return this.graphData}var t=this.getView().getNodeFilter("compiled");var i=this.adapter.getGraph(t,{view:this.view,neighbourhoodScope:parseInt(this.getView().getConfig("neighbourhood_scope"))});var s=i.nodes;var a=i.edges;this.graphData.nodes=r.refresh(s,this.graphData.nodesById,this.graphData.nodes);this.graphData.edges=r.refresh(a,this.graphData.edgesById,this.graphData.edges);this.graphData.nodesById=s;this.graphData.edgesById=a;$tw.tmap.stop("Reloading Network");return this.graphData};o.prototype.isViewBound=function(){return r.startsWith(this.getViewHolderRef(),this.opt.path.localHolders)};o.prototype.isViewSwitched=function(e){if(this.isViewBound()){return false}else{return r.hasOwnProp(e,this.getViewHolderRef())}};o.prototype.checkOnEditorBar=function(e,t,i){if(t||i.length){this.removeChildDomNodes();this.rebuildEditorBar();this.renderChildren(this.graphBarDomNode);return true}else{return this.refreshChildren(e)}};o.prototype.checkOnGraph=function(e){var t=this.getView().getNodeFilter("compiled");var i=r.getMatches(t,Object.keys(e),true);for(var s in e){if(r.isSystemOrDraft(s))continue;var a=i[s];var n=this.graphData.nodesById[this.adapter.getId(s)];if(a||n){this.rebuildGraph();return}}var o=this.getView().getEdgeFilter("compiled");var d=r.getMatches(o,Object.keys(e));if(d.length){this.logger("info","Changed edge stores",d);this.rebuildGraph();return}};o.prototype.initAndRenderGraph=function(e){this.logger("info","Initializing and rendering the graph");this.graphDomNode=document.createElement("div");e.appendChild(this.graphDomNode);$tw.utils.addClass(this.graphDomNode,"tmap-vis-graph");e.style["width"]=this.getAttribute("width","100%");window.addEventListener("resize",this.handleResizeEvent.bind(this),false);if(!this.isContainedInSidebar){this.callbackManager.add("$:/state/sidebar",this.handleResizeEvent.bind(this))}window.addEventListener("click",this.handleClickEvent.bind(this),false);var t=r.getFullScreenApis();if(t){window.addEventListener(t["_fullscreenChange"],this.handleFullScreenChange.bind(this),false)}this.handleResizeEvent();this.graphOptions=this.getGraphOptions();this.graphData={nodes:new n.DataSet,edges:new n.DataSet,nodesById:r.getDataMap(),edgesById:r.getDataMap()};this.network=new n.Network(this.graphDomNode,this.graphData,this.graphOptions);this.canvas=this.graphDomNode.getElementsByTagName("canvas")[0];this.network.on("click",this.handleVisSingleClickEvent.bind(this));this.network.on("doubleClick",this.handleVisDoubleClickEvent.bind(this));this.network.on("stabilized",this.handleVisStabilizedEvent.bind(this));this.network.on("dragStart",this.handleVisDragStart.bind(this));this.network.on("dragEnd",this.handleVisDragEnd.bind(this));this.network.on("select",this.handleVisSelect.bind(this));this.network.on("viewChanged",this.handleVisViewportChanged.bind(this));this.addGraphButtons({"fullscreen-button":this.handleToggleFullscreen});this.setGraphButtonEnabled("fullscreen-button",true);window.setTimeout(function(){if(!r.hasElements(this.graphData.nodesById)){this.rebuildGraph({resetFocus:true})}}.bind(this),100)};o.prototype.getGraphOptions=function(){if(!this.graphOptions){var e=$tw.utils.extendDeepCopy(this.opt.config.vis);e.onDelete=function(e,t){this.handleRemoveElement(e);t({})}.bind(this);e.onConnect=function(e,t){this.handleConnectionEvent(e)}.bind(this);e.onAdd=function(e,t){this.handleInsertNode(e)}.bind(this);e.onEditEdge=function(e,t){var i=this.handleReconnectEdge(e)}.bind(this);e.onEdit=function(e,t){this.openTiddlerWithId(e.id)}.bind(this);e.dataManipulation={enabled:this.editorMode?true:false,initiallyVisible:true};e.navigation=true;e.clickToUse=this.getAttribute("click-to-use")!=="false"}else{var e=this.graphOptions}e.stabilizationIterations=this.getView().getStabilizationIterations();return e};o.prototype.handleCreateView=function(){this.dialogManager.open("createView",null,function(e,t){if(e){var i=r.getText(t);if(!this.getView().isLocked()){var s=this.adapter.createView(i);this.setView(s.getRoot())}else{this.notify("Forbidden!")}}})};o.prototype.handleRenameView=function(){if(!this.getView().isLocked()){var e=this.getView().getReferences();var t={count:e.length.toString(),filter:r.joinAndWrap(e,"[[","]]")};this.dialogManager.open("getViewName",t,function(e,t){if(e){var i=r.getText(t);if(!this.getView().isLocked()){this.view.rename(i);this.setView(this.view.getRoot())}else{this.notify("Forbidden!")}}})}else{this.notify("Forbidden!")}};o.prototype.handleEditView=function(){var e={"var.edgeFilter":this.getView().getEdgeFilter("expression"),dialog:{preselects:this.getView().getConfig()}};this.dialogManager.open("configureView",e,function(e,t){if(e&&t){var i=r.getPropertiesByPrefix(t.fields,"config.");this.getView().setConfig(i)}})};o.prototype.handleDeleteView=function(){var e=this.getView().getLabel();if(this.getView().isLocked()){this.notify("Forbidden!");return}var t=this.getView().getReferences();if(t.length){var i={count:t.length.toString(),filter:r.joinAndWrap(t,"[[","]]")};this.dialogManager.open("cannotDeleteViewDialog",i,null);return}var s="You are about to delete the view "+"''"+e+"'' (no tiddler currently references this view).";this.openStandardConfirmDialog(function(t){if(t){this.getView().destroy();this.setView(this.opt.path.views+"/default");this.notify('view "'+e+'" deleted ')}},s)};o.prototype.handleTriggeredRefresh=function(e){this.logger("log","Tiddler",e,"triggered a refresh");this.rebuildGraph({resetData:false,resetOptions:false,resetFocus:{delay:1e3,duration:1e3}})};o.prototype.handleConfigureSystem=function(){var e=r.flatten({config:{sys:this.opt.config.sys}});var t=this.adapter.getView("Live View").getConfig("neighbourhood_scope");var i={dialog:{preselects:$tw.utils.extend(e,{liveViewScope:t})}};this.dialogManager.open("configureTiddlyMap",i,function(e,t){if(e&&t){var i=r.getPropertiesByPrefix(t.fields,"config.sys.",true);if(i["field.nodeId"]!==this.opt.field.nodeId&&isWelcomeDialog!==true){var s={name:"Node-id",oldValue:this.opt.field.nodeId,newValue:i["field.nodeId"]};this.dialogManager.open("fieldChanged",s,function(e,t){if(e){r.moveFieldValues(s.oldValue,s.newValue,true,false);this.notify("Transported field values")}})}this.wiki.setTiddlerData(this.opt.ref.sysConf+"/user",i);this.adapter.getView("Live View").setConfig("neighbourhood_scope",t.fields.liveViewScope)}})};o.prototype.handleReconnectEdge=function(e){var t=this.graphData.edges.get(e.id);this.adapter.deleteEdge(t);var i=$tw.utils.extend(t,e);return this.adapter.insertEdge(i)};o.prototype.handleRemoveElement=function(e){if(e.edges.length&&!e.nodes.length){this.handleRemoveEdges(e.edges)}if(e.nodes.length){this.handleRemoveNode(this.graphData.nodesById[e.nodes[0]])}this.network.selectNodes([])};o.prototype.handleRemoveEdges=function(e){this.adapter.deleteEdges(this.graphData.edges.get(e));this.notify("edge"+(e.length>1?"s":"")+" removed")};o.prototype.handleRemoveNode=function(e){var t={"var.nodeLabel":e.label,"var.nodeRef":$tw.tmap.indeces.tById[e.id],dialog:{preselects:{"opt.delete":"from"+" "+(this.getView().isExplicitNode(e)?"filter":"system")}}};this.dialogManager.open("deleteNodeDialog",t,function(t,i){if(t){if(i.fields["opt.delete"]==="from system"){this.adapter.deleteNode(e)}else{var s=this.getView().removeNodeFromFilter(e);if(!s){this.notify("Couldn't remove node from filter");return}}this.notify("Node removed "+i.fields["opt.delete"])}})};o.prototype.handleFullScreenChange=function(){var e=r.getFullScreenApis();if(e&&this.enlargedMode==="fullscreen"&&!document[e["_fullscreenElement"]]){this.handleToggleFullscreen()}};o.prototype.handleToggleFullscreen=function(){var e=r.getFullScreenApis();this.logger("log","Toggled graph enlargement");if(this.enlargedMode){r.findAndRemoveClassNames(["tmap-"+this.enlargedMode,"tmap-has-"+this.enlargedMode+"-child"]);if(this.enlargedMode==="fullscreen"){document[e["_exitFullscreen"]]()}this.enlargedMode=null}else{var t=r.isTrue(this.opt.config.sys.halfscreen);if(!t&&!e){this.dialogManager.open("fullscreenNotSupported",{dialog:{buttons:"ok_suppress"}});return}this.enlargedMode=this.isContainedInSidebar&&t?"halfscreen":"fullscreen";$tw.utils.addClass(this.parentDomNode,"tmap-"+this.enlargedMode);var i=this.isContainedInSidebar?this.sidebar:document.getElementsByClassName("tc-story-river")[0];$tw.utils.addClass(i,"tmap-has-"+this.enlargedMode+"-child");if(this.enlargedMode==="fullscreen"){document.documentElement[e["_requestFullscreen"]](Element.ALLOW_KEYBOARD_INPUT)}this.notify("Activated "+this.enlargedMode+" mode")}this.handleResizeEvent()};o.prototype.handleGenerateWidget=function(e){$tw.rootWidget.dispatchEvent({type:"tmap:tm-generate-widget",paramObject:{view:this.getView().getLabel()}})};o.prototype.handleShowContentPreview=function(e){var t={"param.ref":e};this.dialogManager.open("previewContent",t)};o.prototype.handleStorePositions=function(e){this.adapter.storePositions(this.network.getPositions(),this.getView());if(e){this.notify("positions stored")}};o.prototype.handleEditFilters=function(){var e=r.getPrettyFilter(this.getView().getNodeFilter("expression"));var t=r.getPrettyFilter(this.getView().getEdgeFilter("expression"));var i={dialog:{preselects:{prettyNodeFilter:e,prettyEdgeFilter:t}}};this.dialogManager.open("editFilters",i,function(i,s){if(i){this.getView().setNodeFilter(r.getField(s,"prettyNodeFilter",e));this.getView().setEdgeFilter(r.getField(s,"prettyEdgeFilter",t))}})};o.prototype.handleVisStabilizedEvent=function(e){if(!this.hasNetworkStabilized){this.hasNetworkStabilized=true;this.logger("log","Network stabilized after "+e.iterations+" iterations");this.getView().setStabilizationIterations(e.iterations);var t=this.getView().isEnabled("physics_mode");this.network.storePositions();this.setNodesMoveable(this.graphData.nodesById,t);if(this.doZoomAfterStabilize){this.doZoomAfterStabilize=false;this.fitGraph(1e3,1e3)}}};o.prototype.handleFocusNode=function(e){this.network.focusOnNode(this.adapter.getId(e.param),{scale:1,animation:true})};o.prototype.fitGraph=function(e,t){window.clearTimeout(this.activeZoomExtentTimeout);var i=function(){this.network.zoomExtent({duration:t});this.activeZoomExtentTimeout=0}.bind(this);if(e){this.activeZoomExtentTimeout=window.setTimeout(i,e)}else{i()}};o.prototype.handleStartStabilizionEvent=function(e){};o.prototype.handleInsertNode=function(e){this.dialogManager.open("getNodeTitle",null,function(t,i){if(t){var s=r.getText(i);if(r.tiddlerExists(s)){if(r.isMatch(s,this.getView().getNodeFilter("compiled"))){this.notify("Node already exists")}else{e=this.adapter.makeNode(s,e,this.getView());this.getView().addNodeToView(e);this.rebuildGraph()}}else{e.label=s;this.adapter.insertNode(e,{view:this.getView(),editNodeOnCreate:false});this.preventNextContextReset=true}}})};o.prototype.handleVisSingleClickEvent=function(e){if(r.isTrue(this.opt.config.sys.singleClickMode)){this.handleVisClickEvent(e)}};o.prototype.handleVisDoubleClickEvent=function(e){if(!e.nodes.length&&!e.edges.length){if(this.editorMode){this.handleInsertNode(e.pointer.canvas)}}else if(!r.isTrue(this.opt.config.sys.singleClickMode)){this.handleVisClickEvent(e)}};o.prototype.handleVisClickEvent=function(e){if(e.nodes.length){this.openTiddlerWithId(e.nodes[0])}else if(e.edges.length){if(!this.editorMode)return;this.logger("debug","Clicked on an Edge");var t=this.opt.config.sys.edgeClickBehaviour;var i=new a(this.graphData.edgesById[e.edges[0]].type);if(t==="manager"){$tw.rootWidget.dispatchEvent({type:"tmap:tm-manage-edge-types",paramObject:{type:i.getId()}})}}};o.prototype.handleResizeEvent=function(e){if(this.isContainedInSidebar){var t=window.innerHeight;var i=this.parentDomNode.getBoundingClientRect().top;if(this.isContainedInSidebar){}var s=this.getAttribute("bottom-spacing","25px");var r=t-i+"px";this.parentDomNode.style["height"]="calc("+r+" - "+s+")"}else{var a=this.getAttribute("height");this.parentDomNode.style["height"]=a?a:"300px"}if(this.network){this.repaintGraph()}};o.prototype.handleClickEvent=function(e){if(!document.body.contains(this.parentDomNode)){window.removeEventListener("click",this.handleClickEvent);return}if(this.network){var t=document.elementFromPoint(e.clientX,e.clientY);if(!this.parentDomNode.contains(t)){var i=this.network.getSelection();if(i.nodes.length||i.edges.length){this.logger("debug","Clicked outside; deselecting nodes/edges");this.network.selectNodes([])}}}};o.prototype.handleVisDragEnd=function(e){if(e.nodeIds.length){var t=this.getView().isEnabled("physics_mode");var i=this.graphData.nodesById[e.nodeIds[0]];if(!t){this.setNodesMoveable([i],false);var s=parseInt(this.opt.config.sys.raster);if(s){var r=this.network.getPositions()[i.id];this.graphData.nodes.update({id:i.id,x:r.x-r.x%s,y:r.y-r.y%s})}this.handleStorePositions()}}};o.prototype.handleVisSelect=function(e){};o.prototype.handleVisViewportChanged=function(e){this.doZoomAfterStabilize=false};o.prototype.handleVisDragStart=function(e){if(e.nodeIds.length){var t=this.graphData.nodesById[e.nodeIds[0]];this.setNodesMoveable([t],true)}};o.prototype.destruct=function(){window.removeEventListener("resize",this.handleResizeEvent);this.network.destroy()};o.prototype.openTiddlerWithId=function(e){var t=$tw.tmap.indeces.tById[e];this.logger("debug","Opening tiddler",t,"with id",e);if(this.enlargedMode==="fullscreen"){this.handleShowContentPreview(t)}else{this.dispatchEvent({type:"tm-navigate",navigateTo:t})}};o.prototype.getViewHolderRef=function(){if(this.viewHolderRef){return this.viewHolderRef}this.logger("info","Retrieving or generating the view holder reference");var e=this.getAttribute("view");if(e){this.logger("log",'User wants to bind view "'+e+'" to graph');var t=this.opt.path.views+"/"+e;if(this.wiki.getTiddler(t)){var i=this.opt.path.localHolders+"/"+r.genUUID();this.logger("log",'Created an independent temporary view holder "'+i+'"');this.wiki.addTiddler(new $tw.Tiddler({title:i,text:t}));this.logger("log",'View "'+t+'" inserted into independend holder')}else{this.logger("log",'View "'+e+'" does not exist')}}if(typeof i==="undefined"){this.logger("log","Using default (global) view holder");var i=this.opt.ref.defaultGraphViewHolder}return i};o.prototype.setView=function(e,t){if(e){if(!t){t=this.viewHolderRef}this.logger("info",'Inserting view "'+e+'" into holder "'+t+'"');this.wiki.addTiddler(new $tw.Tiddler({title:t,text:e}))}this.view=this.getView(true)};o.prototype.getView=function(e){if(!e&&this.view){return this.view}var i=this.getViewHolderRef();var s=new t(r.getText(i));this.logger("info",'Retrieved view "'+s.getLabel()+'" from holder "'+i+'"');if(s.exists()){return s}else{this.logger("log",'Warning: View "'+s.getLabel()+"\" doesn't exist. Default is used instead.");return new t("Default")}};o.prototype.repaintGraph=function(){var e=r.getFullScreenApis();if(!e||!document[e["_fullscreenElement"]]||this.enlargedMode){this.logger("info","Repainting the whole graph");this.network.redraw();this.fitGraph(0,1e3)}};o.prototype.setGraphButtonEnabled=function(e,t){var i="network-navigation tmap-vis-button"+" "+"tmap-"+e;var s=this.parentDomNode.getElementsByClassName(i)[0];$tw.utils.toggleClass(s,"tmap-button-enabled",t)};o.prototype.setNodesMoveable=function(e,t){this.network.storePositions();var i=[];var s=Object.keys(e);for(var r=0;r<s.length;r++){var a=e[s[r]].id;var n={id:a,allowedToMoveX:t,allowedToMoveY:t};i.push(n)}this.graphData.nodes.update(i)};o.prototype.addGraphButtons=function(e){var t=this.parentDomNode.getElementsByClassName("vis network-frame")[0];for(var i in e){var s=document.createElement("div");s.className="network-navigation tmap-vis-button "+" "+"tmap-"+i;s.addEventListener("click",e[i].bind(this),false);t.appendChild(s)}};exports.tiddlymap=o})();