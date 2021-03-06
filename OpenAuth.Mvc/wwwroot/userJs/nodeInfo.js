layui.config({
    base: "/js/"
}).use(['form', 'vue', 'ztree', 'layer', 'element', 'jquery', 'utils'], function () {
    var layer = layui.layer,
        $ = layui.jquery;
    var form = layui.form;
    var users = []; //节点的执行人
    var roles = []; //节点执行角色

    var index = layer.getFrameIndex(window.name); //获取窗口索引
    //从flowschemes.js进入的节点信息
    var node = parent.FlowDesignObject;
    console.log(JSON.stringify(node));

    var vm = new Vue({
        el: "#formEdit",
        data() {
            return {
                tmp: {
                    NodeName: node.name,
                    NodeCode: node.name,//默认的code
                    NodeRejectType: "0",
                    NodeDesignate: "ALL_USER",
                    NodeConfluenceType: "all"
                }
            }

        },
        watch:{
            tmp(val){
                this.$nextTick(function () {
                   form.render();  //刷新select等
               })
            }
        },
        mounted(){
             form.render();
        },
        methods: {
            isFork: function () {
                return node.type === 'fork';
            }
        }
    });

    //初始化节点设置信息
    if (node.setInfo != null) {
        vm.tmp = Object.assign({}, vm.tmp, node.setInfo)
        users = node.setInfo.NodeDesignateData.users;
        roles = node.setInfo.NodeDesignateData.roles;
    }
    // form.render(); //重新渲染，防止radio/select等失效

    form.on('select(NodeRejectType)',
        function (data) {
            vm.tmp.NodeRejectType = data.value;
        });

    form.on('select(NodeConfluenceType)',
        function (data) {
            vm.tmp.NodeConfluenceType = data.value;
        });

    //菜单列表
    var menucon = {}; //table的参数，如搜索key，点击tree的id
    //用户列表，等lay table没问题了，可以换成table
    var userstree = function () {
        var url = '/UserManager/Load';
        var menuTree;
        var setting = {
            view: {
                selectedMulti: true
            },
            check: {
                enable: true,
                chkStyle: "checkbox",
                chkboxType: {
                    "Y": "",
                    "N": ""
                } //去掉勾选时级联
            },
            data: {
                key: {
                    name: 'Name',
                    title: 'Name'
                },
                simpleData: {
                    enable: true,
                    idKey: 'Id',
                    pIdKey: 'ParentId',
                    rootPId: 'null'
                }
            },
            callback: {
                onCheck: function (event, treeId, treeNode) {
                    users.push(treeNode.Id);
                }
            }
        };
        var load = function (options) {
            if (options != undefined) {
                $.extend(menucon, options);
            }

            $.getJSON(url, menucon, function (json) {
                menuTree = $.fn.zTree.init($("#userstree"), setting);
                menuTree.addNodes(null, json.data);
                //如果已经分配了用户，则设置相应的状态

                $.each(users,
                    function (i) {
                        var that = this;
                        var node = menuTree.getNodeByParam("Id", that, null);
                        menuTree.checkNode(node, true, false);
                    });
                menuTree.expandAll(true);
            });
        };
        return {
            load: load
        }
    }();

    var rolestree = function () {
        var url = '/RoleManager/Load';
        var rolestree;
        var setting = {
            view: {
                selectedMulti: true
            },
            check: {
                enable: true,
                chkStyle: "checkbox",
                chkboxType: {
                    "Y": "",
                    "N": ""
                } //去掉勾选时级联
            },
            data: {
                key: {
                    name: 'Name',
                    title: 'Name'
                },
                simpleData: {
                    enable: true,
                    idKey: 'Id',
                    pIdKey: 'ParentId',
                    rootPId: 'null'
                }
            },
            callback: {
                onCheck: function (event, treeId, treeNode) {
                    roles.push(treeNode.Id);
                }
            }
        };
        var load = function (options) {
            if (options != undefined) {
                $.extend(menucon, options);
            }

            $.getJSON(url, menucon, function (json) {
                rolestree = $.fn.zTree.init($("#rolestree"), setting);
                rolestree.addNodes(null, json.data);
                //如果已经分配了用户，则设置相应的状态

                $.each(roles,
                    function (i) {
                        var that = this;
                        var node = rolestree.getNodeByParam("Id", that, null);
                        rolestree.checkNode(node, true, false);
                    });
                rolestree.expandAll(true);
            });
        };
        return {
            load: load
        }
    }();

    //左边树状机构列表
    var ztree = function () {
        var url = '/UserSession/GetOrgs';
        var zTreeObj;
        var setting = {
            view: {
                selectedMulti: false
            },
            data: {
                key: {
                    name: 'Name',
                    title: 'Name'
                },
                simpleData: {
                    enable: true,
                    idKey: 'Id',
                    pIdKey: 'ParentId',
                    rootPId: 'null'
                }
            },
            callback: {
                onClick: function (event, treeId, treeNode) {
                    if (vm.tmp.NodeDesignate === "SPECIAL_USER") {
                        userstree.load({
                            orgId: treeNode.Id
                        });
                    } else {
                        rolestree.load({
                            orgId: treeNode.Id
                        });
                    }
                }
            }
        };
        var load = function () {
            $.getJSON(url, function (json) {
                if (vm.tmp.NodeDesignate === "ALL_USER") return;
                zTreeObj = $.fn.zTree.init($("#tree"), setting);
                var newNode = {
                    Name: "全部",
                    Id: null,
                    ParentId: ""
                };
                json.push(newNode);
                zTreeObj.addNodes(null, json);
                if (vm.tmp.NodeDesignate === "SPECIAL_USER") {
                    userstree.load({
                        orgId: ''
                    });
                } else if (vm.tmp.NodeDesignate === "SPECIAL_ROLE") {
                    rolestree.load({
                        orgId: ''
                    });
                }
                zTreeObj.expandAll(true);
            });
        };
        load();
        return {
            reload: load
        }
    }();


    form.on('radio(NodeDesignate)',
        function (data) {
            vm.tmp.NodeDesignate = data.value;
            if (data.value === "SPECIAL_USER") {
                userstree.load();
                ztree.reload();
            } else if (data.value === "SPECIAL_ROLE") {
                rolestree.load();
                ztree.reload();
            }
        });

    //提供给上父页面调用
    getVal = function () {
        var result = {
            NodeDesignateData: { //节点指定操作人
                users: users,
                roles: roles,
                orgs: []
            }
        };
        $.extend(result, vm.tmp);
        return result;
    }

    //让层自适应iframe
    layer.iframeAuto(index);
})