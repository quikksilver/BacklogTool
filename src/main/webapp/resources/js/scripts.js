/*
 *  The MIT License
 *
 *  Copyright 2012 Sony Mobile Communications AB. All rights reserved.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/**
 * Creates a cookie and saves locally.
 * @param name what to call it
 * @param value what value to store
 * @param days how many days until it gets destroyed
 */
function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

/**
 * Reads a locally stored cookie.
 * @param name the name of the cookie to read
 * @returns value if it existed, otherwise null
 */
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

/**
 * Deletes a locally stored cookie.
 * @param name the cookie name to delete
 */
function deleteCookie(name) {
    createCookie(name,"",-1);
}

/**
 * Checks if array a contains an object with same id as argument object
 * @param a array to search in
 * @param obj object with the id to search for
 * @returns {Boolean} if it existed
 */
function contains(a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i].id == obj.id) {
            return true;
        }
    }
    return false;
}

$(document).ready(function () {
    var KEYCODE_ENTER = 13;
    var KEYCODE_ESC = 27;
    var KEYCODE_CTRL = 17;

    /**
     * Formats a date as string
     * @returns {String} date string
     */
    Date.prototype.yyyymmdd = function() {
        var yyyy = this.getFullYear().toString();
        var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
        var dd  = this.getDate().toString();
        return (mm[1]?mm:"0" + mm[0]) + "/" + (dd[1]?dd:"0"+dd[0]) + "/" + yyyy;
    };

    /**
     * Returns date as a formatted string if it existed was not null,
     * otherwise an empty string gets returned.
     * @param dateString string to format
     */
    var getDate = function(dateString) {
        if (dateString == null) {
            return "";
        } else {
            return new Date(dateString).yyyymmdd();
        }
    };

    var getSiteImage = function(site) {
        if (site == "NONE") {
            return "";
        } else {
            return '<img src="../resources/css/ui-lightness/images/'+site+'.png" title="'+site+'" alt="'+site+'"/>';
        }
    };

    var getAttrImage = function(storyAttr) {
        if (storyAttr == null || storyAttr.iconEnabled == false) {
            return '';
        }
        return '<img src="../resources/image/'+storyAttr.icon+'" title="' + getNameIfExists(storyAttr) + '"/> ';
    };

    /**
     * Used to tick checkboxes on archived parent's.
     */
    var getArchived = function(archived) {
        if (archived) {
            return 'checked="checked"';
        } else {
            return '';
        }
    };

    //fix for trim
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    //fix for indexof
    Array.prototype.indexOf = function (obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) {
                return i;
            }
        }
        return -1;
    };

    var disableEdits = function() {
        $( "#create-parent" ).button( "option", "disabled", true );
        $(".add-child-icon").addClass('disabled');
        $(".deleteItem").addClass('disabled');
        $(".editTheme").unbind("dblclick");
        $(".editEpic").unbind("dblclick");
        $(".editStory").unbind("dblclick");
        $(".editTask").unbind("dblclick");
    };

    $("#archived-list-container").hide();
    $('#hide-archived-list-container').change(function () {
        $("#archived-list-container").hide();
        $(".parent-child-list").empty();
        buildVisibleList();
    });

    /**
     * Adding line breaks and <a> tags for the param text.
     */
    var addLinksAndLineBreaks = function(text) {
        return text.replace(/\n/g, '<br />').replace( /(http:\/\/[^\s]+)/gi , '<a href="$1">$1</a>' );
    }

    //Replacing spaces for underlines. Used for linking icons.
    var replaceSpaces = function (string) {
        if(string != null) {
            return string.split(' ').join('_');
        }
    };

    var replaceNullWithEmpty = function (object) {
        if (object == null) {
            return '';
        } else {
            return object;
        }
    };

    var getNameIfExists = function (object) {
        if (object == null) {
            return '';
        } else {
            return object.name;
        }
    };

    var scrollTo = function(id) {
        var offset = $("#"+id).offset().top - $(window).scrollTop();
        if(offset > window.innerHeight) {
            $('html, body').animate({
                scrollTop: $("#" + id).offset().top
            }, 2000);
        }
    };

    var printStories = function() {
        var ids = "";
        for (var i = 0; i < selectedItems.length; i++) {
            ids += (selectedItems[i].id);
            if (i != selectedItems.length-1) {
                ids += ',';
            }
        }
        var url = "../print-stories/" + areaName + "?ids=" + ids;
        window.open(url, "_blank");
    };

    /**
     * Truncate a string to the given length, breaking at word boundaries and adding an elipsis
     * @param string str String to be truncated
     * @param integer limit Max length of the string
     * @return string
     */
    var truncate = function (str, limit) {
        var bits, i;
        if(typeof str != "string") {
            return "";
        }
        bits = str.split('');
        if (bits.length > limit) {
            for (i = bits.length - 1; i > -1; --i) {
                if (i > limit) {
                    bits.length = i;
                }
                else if (' ' === bits[i]) {
                    bits.length = i;
                    break;
                }
            }
            bits.push('...');
        }
        return bits.join('');
    };

    /**
     * Updates the cookie with information about which elements that are selected.
     * Triggered when an item is selected or unselected.
     */
    var updateCookie = function updateCookie() {
        var parentName = null;
        var childName = null;
        if (view == "story-task") {
            parentName = "story";
            childName = "task";
        } else if (view == "epic-story") {
            parentName = "epic";
            childName = "story";
        } else if (view == "theme-epic") {
            parentName = "theme";
            childName = "epic";
        }
        deleteCookie("backlogtool-selectedItems");
        var selectedCookie = new Array();
        for (var i=0; i<selectedItems.length; ++i) {
            var currentItem = new Object();
            currentItem.id = selectedItems[i].id;
            if (selectedItems[i].type == "parent") {
                currentItem.type = parentName;
            } else if (selectedItems[i].type == "child") {
                currentItem.type = childName;
            }
            selectedCookie.push(currentItem);
        }
        createCookie("backlogtool-selectedItems", JSON.stringify(selectedCookie), 1);
    };

    var reload = function reload() {
        readData();
        $(".parent-child-list").empty();
        buildVisibleList();
        $.unblockUI();
    };

    var pushId;

    var addGroupMember = function addGroupMember() {
        pushId = ice.push.createPushId();
        ice.push.addGroupMember(areaName, pushId);
        ice.push.register([pushId], reload);
    };
    addGroupMember();

    var removeGroupMember = function removeGroupMember() {
        ice.push.removeGroupMember(areaName,pushId);
    };

    var displayUpdateMsg = function () {
        $.blockUI({
            message: '<h1>Updating...</h1>',
            fadeIn:  200,
            overlayCSS: { backgroundColor: '#808080', cursor: null},
            fadeOut:  100});
    };

    var parents = null;
    var area = null;
    var storyAttr1Options = null;

    var readData = function readData() {
        $.ajax({
            url: "../json/read" + view + "/" + areaName + "?order=" + $("#orderBy").val(),
            dataType: 'json',
            async: false,
            success: function (data) {
                parents = data;
            }
        });
        $.ajax({
            url: "../json/readArea/" + areaName,
            dataType: 'json',
            async: false,
            success: function (data) {
                area = data;
            }
        });
        storyAttr1Options = "";
        for (var i=0; i<area.storyAttr1.options.length; ++i) {
            storyAttr1Options += '<option value="'+ area.storyAttr1.options[i].id+ '">'
            + area.storyAttr1.options[i].name + '</option>';
        }
        storyAttr2Options = "";
        for (var i=0; i<area.storyAttr2.options.length; ++i) {
            storyAttr2Options += '<option value="'+ area.storyAttr2.options[i].id+ '">'
            + area.storyAttr2.options[i].name + '</option>';
        }
        storyAttr3Options = "";
        for (var i=0; i<area.storyAttr3.options.length; ++i) {
            storyAttr3Options += '<option value="'+ area.storyAttr3.options[i].id+ '">'
            + area.storyAttr3.options[i].name + '</option>';
        }
        taskAttr1Options = "";
        for (var i=0; i<area.taskAttr1.options.length; ++i) {
            taskAttr1Options += '<option value="'+ area.taskAttr1.options[i].id+ '">'
            + area.taskAttr1.options[i].name + '</option>';
        }
        var emptyOption = '<option value=""></option>';

        $("#storyAttr1").empty().append(emptyOption);
        $("#storyAttr1").append(storyAttr1Options);

        $("#storyAttr2").empty().append(emptyOption);
        $("#storyAttr2").append(storyAttr2Options);

        $("#storyAttr3").empty().append(emptyOption);
        $("#storyAttr3").append(storyAttr3Options);

        $("#taskAttr1").empty().append(emptyOption);
        $("#taskAttr1").append(taskAttr1Options);

    };

    readData();

    Array.prototype.remove = function (value) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == value ||
                    (this[i].id != null && (this[i].id == value.id) || this[i].id == value)) {
                this.splice(i, 1);
                break;
            }
        }
    };

    var visible = new Object();

    var getParent = function (id) {
        for (var i = 0; i < parents.length; ++i) {
            if (parents[i].id == id) {
                return parents[i];
            }
        }
    };

    var getChild = function (id) {
        for (var i = 0; i < parents.length; ++i) {
            for (var k = 0; k < parents[i].children.length; ++k) {
                if (parents[i].children[k].id == id) {
                    return parents[i].children[k];
                };
            }
        }
    };

    var focusAndSelectText = function(id) {
        $("#"+id).focus();
        $("#"+id).select();
    };

    $('#orderBy').bind('change', function() {
        displayUpdateMsg();
        reload();
        if ($("#orderBy").val() == "prio") {
            $("#list-container").sortable("option", "disabled", false);
        } else {
            $("#list-container").sortable("option", "disabled", true);
        }
    });

    var expandClick = function (e) {
        if ($(this).attr("class").indexOf("ui-icon-triangle-1-s") != -1) {
            $(this).removeClass("ui-icon-triangle-1-s");
            $(this).addClass("ui-icon-triangle-1-e");
        } else if ($(this).attr("class").indexOf("ui-icon-triangle-1-e") != -1) {
            $(this).removeClass("ui-icon-triangle-1-e");
            $(this).addClass("ui-icon-triangle-1-s");
        }
        var belongingChildren = $(this).closest('li').attr("children").trim().split(' ');
        for (var k = 0; k < belongingChildren.length; ++k) {
            var currentChildId = belongingChildren[k];
            $('#' + currentChildId).slideToggle();
            if (visible[currentChildId]) {
                visible[currentChildId] = false;
            } else {
                visible[currentChildId] = true;
            }
        }
        e.stopPropagation();
    };

    //Read cookie with selected items..
    var selectedItems = new Array();
    try {
        var selectedItemsCookie = JSON.parse(readCookie("backlogtool-selectedItems"));
    } catch(error) {
        selectedItemsCookie = new Array();
    }
    if(selectedItemsCookie != null) {
        for (var i=0; i<selectedItemsCookie.length; ++i) {
            var cookieItem = selectedItemsCookie[i];
            if (view == "story-task") {
                if (cookieItem.type == "story") {
                    var selectedItem = new Object();
                    selectedItem.id = cookieItem.id;
                    selectedItem.type = "parent";
                    if (!contains(selectedItems, selectedItem)) {
                        selectedItems.push(selectedItem);
                    }
                } else if (cookieItem.type == "task") {
                    var selectedItem = new Object();
                    selectedItem.id = cookieItem.id;
                    selectedItem.type = "child";
                    if (!contains(selectedItems, selectedItem)) {
                        selectedItems.push(selectedItem);
                    }
                } else if (cookieItem.type == "theme") {
                    //Add all stories that are in this theme
                    for (var k=0; k<parents.length; ++k) {
                        var parent = parents[k];
                        if (parent.themeId == cookieItem.id) {
                            var selectedItem = new Object();
                            selectedItem.id = parent.id;
                            selectedItem.type = "parent";
                            if (!contains(selectedItems, selectedItem)) {
                                selectedItems.push(selectedItem);
                            }
                        }
                    }
                } else if (cookieItem.type == "epic") {
                    //Add all stories that are in this epic
                    for (var k=0; k<parents.length; ++k) {
                        var parent = parents[k];
                        if (parent.epicId == cookieItem.id) {
                            var selectedItem = new Object();
                            selectedItem.id = parent.id;
                            selectedItem.type = "parent";
                            if (!contains(selectedItems, selectedItem)) {
                                selectedItems.push(selectedItem);
                            }
                        }
                    }
                }
            } else if (view == "epic-story") {
                if (cookieItem.type == "epic") {
                    var selectedItem = new Object();
                    selectedItem.id = cookieItem.id;
                    selectedItem.type = "parent";
                    if (!contains(selectedItems, selectedItem)) {
                        selectedItems.push(selectedItem);
                    }
                } else if (cookieItem.type == "story") {
                    var selectedItem = new Object();
                    selectedItem.id = cookieItem.id;
                    selectedItem.type = "child";
                    if (!contains(selectedItems, selectedItem)) {
                        selectedItems.push(selectedItem);
                    }
                } else if (cookieItem.type == "theme") {
                    //Add all epics that are in this theme
                    for (var k=0; k<parents.length; ++k) {
                        var parent = parents[k];
                        if (parent.themeId == cookieItem.id) {
                            var selectedItem = new Object();
                            selectedItem.id = parent.id;
                            selectedItem.type = "parent";
                            if (!contains(selectedItems, selectedItem)) {
                                selectedItems.push(selectedItem);
                            }
                        }
                    }
                }
            } else if (view == "theme-epic") {
                if (cookieItem.type == "theme") {
                    var selectedItem = new Object();
                    selectedItem.id = cookieItem.id;
                    selectedItem.type = "parent";
                    if (!contains(selectedItems, selectedItem)) {
                        selectedItems.push(selectedItem);
                    }
                } else if (cookieItem.type == "epic") {
                    var selectedItem = new Object();
                    selectedItem.id = cookieItem.id;
                    selectedItem.type = "child";
                    if (!contains(selectedItems, selectedItem)) {
                        selectedItems.push(selectedItem);
                    }
                }
            }
        }
    }
    var editingItems = new Array();
    var lastPressed = null;

    var liClick = function (pressed) {
        if (pressed.type != null) {
            //If the method was triggered by an event,
            //then use $(this) as the pressed element
            pressed = $(this);
        }

        if (isShift && isCtrl) {
            isCtrl = false;
        }

        if (!isCtrl ||
                (selectedItems[0] != null && pressed.attr("class").indexOf(selectedItems[0].type) == -1)) {
            //If Ctrl was not held down or the type pressed was not same as last time,
            //then reset all selected items.
            deleteCookie("backlogtool-selectedItems");
            selectedItems = new Array();
            $(".parent-child-list").children("li").removeClass("ui-selected");
        }

        if (pressed.attr("class").indexOf("parent") != -1) {
            //Parent was selected
            if (pressed.attr("class").indexOf("ui-selected") != -1) {
                //Already selected
                pressed.removeClass("ui-selected");
                selectedItems.remove({id:pressed.attr("id")});
            } else {
                //Not already selected
                pressed.addClass("ui-selected");
                selectedItems.push({id:pressed.attr("id"), type:"parent"});
            }
        } else {
            //Child was selected
            if (pressed.attr("class").indexOf("ui-selected") != -1) {
                //Already selected
                pressed.removeClass("ui-selected");
                selectedItems.remove({id:pressed.attr("id")});
            } else {
                //Not already selected
                pressed.addClass("ui-selected");
                selectedItems.push({id:pressed.attr("id"), type:"child"});
            }
        }
        lastPressed = pressed;
        updateCookie();
    };

    var createTask = function(event) {
        displayUpdateMsg();
        removeGroupMember();
        var task = new Object();
        task.parentId = event.target.id;

        $.ajax({
            url : "../json/createtask/" + areaName,
            type : 'POST',
            dataType : 'json',
            data : JSON.stringify(task),
            contentType : "application/json; charset=utf-8",
            success : function(newId) {
                if (newId != null) {
                    visible[newId] = true;
                    selectedItems = new Array();
                    selectedItems.push({id : newId, type : "child"});
                    updateCookie();
                }
                reload();
                editTask(newId);
                scrollTo(newId);
                focusAndSelectText("taskTitle"+newId);
            },
            error : function(request, status, error) {
                alert(error);
                reload();
            }
        });
        event.stopPropagation();
    };

    var createStory = function(event) {
        displayUpdateMsg();
        removeGroupMember();
        var storyContainer = new Object();
        storyContainer.added = new Date();

        if (view == "epic-story") {
            newStoryEpicID = event.target.id;
            var epic = getParent(newStoryEpicID);
            storyContainer.epicTitle = epic.title;
            storyContainer.themeTitle = epic.themeTitle;
        }
        $.ajax({
            url : "../json/createstory/" + areaName,
            type : 'POST',
            dataType : 'json',
            data : JSON.stringify(storyContainer),
            contentType : "application/json; charset=utf-8",
            success : function(newId) {
                if (newId != null) {
                    visible[newId] = true;
                    selectedItems = new Array();
                    if (view == "story-task") {
                        selectedItems.push({id : newId, type : "parent"});
                    } else if (view == "epic-story") {
                        selectedItems.push({id : newId, type : "child"});
                    }
                    updateCookie();
                }
                reload();
                editStory(newId);
                scrollTo(newId);
                focusAndSelectText("title"+newId);
            },
            error : function(error) {
                alert(error);
                reload();
            }
        });
        if (event != null) {
            event.stopPropagation();
        }
    };

    var createEpic = function(event) {
        displayUpdateMsg();
        removeGroupMember();
        var epicContainer = new Object();

        if(view == "theme-epic") {
            newEpicThemeID = event.target.id;
            var theme = getParent(newEpicThemeID);
            epicContainer.themeTitle = theme.title;
        }

        $.ajax({
            url : "../json/createepic/" + areaName,
            type : 'POST',
            dataType : 'json',
            data : JSON.stringify(epicContainer),
            contentType : "application/json; charset=utf-8",
            success : function(newId) {
                if (newId != null) {
                    visible[newId] = true;
                    selectedItems = new Array();
                    if (view == "epic-story") {
                        selectedItems.push({id : newId, type : "parent"});
                    } else if (view == "theme-epic") {
                        selectedItems.push({id : newId, type : "child"});
                    }
                    updateCookie();
                }
                reload();
                editEpic(newId);
                scrollTo(newId);
                focusAndSelectText("epicTitle" + newId);
            },
            error : function(error) {
                alert(error);
                reload();
            }
        });
        if (event != null) {
            event.stopPropagation();
        }
    };

    var createTheme = function(event) {
        displayUpdateMsg();
        removeGroupMember();
        $.ajax({
            url : "../json/createtheme/" + areaName,
            type : 'POST',
            dataType : 'json',
            contentType : "application/json; charset=utf-8",
            success : function(newId) {
                if (newId != null) {
                    visible[newId] = true;
                    selectedItems = new Array();
                    selectedItems.push({id : newId, type : "parent"});
                    updateCookie();
                }
                reload();
                editTheme(newId);
                scrollTo(newId);
                focusAndSelectText("themeTitle" + newId);
            },
            error : function(error) {
                alert(error);
                reload();
            }
        });
    };

    /**
     * Used when pressing the clone icon
     */
    var cloneItem = function(clickedElement, withChildren) {
        displayUpdateMsg();
        var id = clickedElement.attr("id");

        var type = '';
        if (clickedElement.hasClass('story')) {
            type = 'Story';
        } else if (clickedElement.hasClass('epic')) {
            type = 'Epic';
        } else if (clickedElement.hasClass('theme')) {
            type = 'Theme';
        }

        var familyMember = '';
        if (clickedElement.closest("li").hasClass("parentLi")) {
            familyMember = 'parent';
        } else if (clickedElement.closest("li").hasClass("childLi")) {
            familyMember = 'child';
        }

        var clonedItem = new Object();
        clonedItem.id = id;
        clonedItem.withChildren = withChildren;

        $.ajax({
            url : "../json/clone" + type + "/" + areaName,
            type : 'POST',
            data: clonedItem,
            success : function(newId) {
                if (newId != null) {
                    visible[newId] = true;
                    selectedItems = new Array();
                    selectedItems.push({id : newId, type : familyMember});
                    updateCookie();
                }
                reload();
                editStory(newId);
                scrollTo(newId);
            },
            error : function(error) {
                alert(error);
                reload();
            }
        });
    };

    var deleteItem = function (event) {
        itemId = event.target.id;
        var item = $(event.target).closest('li');
        if (item.hasClass("task")) {
            item = "task";
        } else if (item.hasClass("story")) {
            item = "story";
        } else if (item.hasClass("epic")) {
            item = "epic";
        } else if (item.hasClass("theme")) {
            item = "theme";
        };

        $('#delete-item').attr("title","Delete "+item);
        $("#deleteDescription").text("Are you sure you want to delete this " + item + "?");
        $('#delete-item').dialog({
            resizable: false,
            height:180,
            modal: true,
            buttons: {
                Delete: function() {
                    displayUpdateMsg();
                    $.ajax({
                        url: "../json/delete" + item + "/" + areaName,
                        type: 'POST',
                        dataType: 'json',
                        data: JSON.stringify(parseInt(itemId)),
                        contentType: "application/json; charset=utf-8",
                        success: function (data) {
                            reload();
                        },
                        error: function (request, status, error) {
                            alert(error);
                            reload();
                        }
                    });
                    $(this).dialog("close");
                },
                Cancel: function() {
                    $(this).dialog("close");
                }
            }
        });
        event.stopPropagation();
    };

    /**
     * Cancel current editing of parents/children.
     */
    var cancel = function(event) {
        var id = event.data.id;
        editingItems.remove({id:id});
        $("."+id).toggleClass('hidden-edit');
        if(editingItems.length == 0) {
            addGroupMember();
            reload();
            $('.saveButton').button( "option", "disabled", true ); 
        }
    };

    /**
     * Cancel current editing of parents/children.
     */
    var bulkCancel = function() {            
        for(var j = 0; j < editingItems.length; j++) {
            var id = editingItems[j].id;
            $("."+id).toggleClass('hidden-edit');
            editingItems.remove({id:id});
        }
        if(editingItems.length == 0) {
            $('.saveButton').button( "option", "disabled", true );
            addGroupMember();
        }
        reload();
    };

    /**
     * Save current editing of parents/children.
     */
    var bulkSave = function() {
        displayUpdateMsg();
        var pushUpdate = false;
        for(var j = 0; j < editingItems.length; j++) {
            if (j == editingItems.length-1) {
                //If last item, we want to trigger a push update
                pushUpdate = true;
            }
            var id = eval(editingItems[j].id);
            if(editingItems[j].type == "task") {
                saveTask(id, pushUpdate);
            } else if(editingItems[j].type == "story") {
                saveStory(id, pushUpdate);
            } else if (editingItems[j].type == "epic") {
                saveEpic(id, pushUpdate);
            } else if (editingItems[j].type == "theme") {
                saveTheme(id, pushUpdate);
            }
            $("."+id).toggleClass('hidden-edit');
        }
        editingItems = new Array();
        reload();
        addGroupMember();
    };

    /**
     * Returns true if you are going into edit mode on a parent/child.
     */
    var isGoingIntoEdit = function isGoingIntoEdit(editId){
        for(var i = 0; editingItems.length > i; i++) {
            if(editingItems[i].id == editId) {
                return false;
            }
        }
        return true;
    };

    var editStory = function(event) {
        var storyId = null;
        if (typeof event == "number") {
            storyId = event;
        } else {
            storyId = $(this).attr('id');
        }
        if(view == "story-task") {
            var story = getParent(storyId);
        } else {
            story = getChild(storyId);
        }
        if(isGoingIntoEdit(storyId)) {
            //Because the height is fixed when the list is generated(to fix the slidetoggle-bug)
            $('li.childLi').css("height", "auto");
            editingItems.push({id:storyId, type:"story"});
            removeGroupMember();
            $('button.'+storyId).button();
            $('button.'+storyId).unbind();
            $('.cancelButton.'+storyId).click({id: storyId},cancel);
            //Sets values for all edit fields
            $("#deadline"+storyId).datepicker();
            $("#added"+storyId).datepicker();

            if (story.deadline == null) {
                $("#deadline"+storyId).val("");
            } else {
                $("#deadline"+storyId).datepicker('setDate', new Date(story.deadline));
            }
            if (story.added == null) {
                $("#added"+storyId).val("");
            } else {
                $("#added"+storyId).datepicker('setDate', new Date(story.added));
            }

            $("."+storyId).toggleClass('hidden-edit');

            if (story.storyAttr1 != null) {
                $("select#storyAttr1"+storyId).val(story.storyAttr1.id);
            }
            if (story.storyAttr2 != null) {
                $("select#storyAttr2"+storyId).val(story.storyAttr2.id);
            }
            if (story.storyAttr3 != null) {
                $("select#storyAttr3"+storyId).val(story.storyAttr3.id);
            }
            $("select#customerSite"+storyId).val(story.customerSite);
            $("select#contributorSite"+storyId).val(story.contributorSite);
            $("archiveStory"+storyId).val(story.archived);

            $("textarea#theme"+storyId).autocomplete({
                minLength: 0,
                source: "../json/autocompletethemes/" + areaName,
                change: function() {
                    $("textarea#epic"+storyId).attr("value", "");
                },
                select: function (event, data) {
                    $('.saveButton').button( "option", "disabled", false );
                    $("textarea#epic"+storyId).attr("value", "");
                    //Used for deselecting the input field.
                    $(this).autocomplete('disable');
                    $(this).autocomplete('enable');
                }
            });
            $("textarea#epic"+storyId).autocomplete({
                minLength: 0,
                search: function() {
                    var themeName = $("textarea#theme"+storyId).val();
                    $("textarea#epic"+storyId).autocomplete({source: "../json/autocompleteepics/" + areaName + "?theme=" + themeName});
                },
                select: function (event, data) {
                    $('.saveButton').button( "option", "disabled", false );
                    $("textarea#epic"+storyId).attr("value", "");

                    //Used for deselecting the input field.
                    $(this).autocomplete('disable');
                    $(this).autocomplete('enable');
                }
            });

            $("textarea#theme"+storyId).focus(function() {
                $("textarea#theme"+storyId).autocomplete("search", $("textarea#theme"+storyId).val());
            });

            $("textarea#epic"+storyId).focus(function() {
                $("textarea#epic"+storyId).autocomplete("search", $("textarea#epic"+storyId).val());
            });

            //auto resize the textareas to fit the text
            $('textarea'+"."+storyId).autosize('');
        } else {
            editingItems.remove({id:storyId});
            $("."+storyId).toggleClass('hidden-edit');
            if(editingItems.length == 0) {
                $('.saveButton').button( "option", "disabled", true );
                addGroupMember();
                reload();
            }
            //Slide toggle fix
            $('li.childLi').css("height", $('li.childLi').height());
        }
    };

    var saveStory = function(event, pushUpdate) {
        var storyId = null;
        if(typeof event == "number") {
            storyId = event;
        }
        else {
            storyId = event.data.storyId;
        }
        displayUpdateMsg();

        //Creates a new story and sets all updated values
        var story = new Object();
        story.id = eval(storyId);
        story.title = $('#title' + storyId).val();
        story.description = $('#description' + storyId).val();
        story.customerSite = $('#customerSite' + storyId).val();
        story.contributorSite = $('#contributorSite' + storyId).val();
        story.customer = $('#customer' + storyId).val();
        story.contributor = $('#contributor' + storyId).val();
        story.epicTitle = $('#epic' + storyId).val();
        story.themeTitle = $('#theme' + storyId).val();
        story.added = new Date($('#added' + storyId).val());
        story.archived = $('#archiveStory' + storyId).is(':checked');
        story.deadline = new Date($('#deadline' + storyId).val());
        story.storyAttr1Id = $('#storyAttr1' + storyId).val();
        story.storyAttr2Id = $('#storyAttr2' + storyId).val();
        story.storyAttr3Id = $('#storyAttr3' + storyId).val();

        $.ajax({
            url: "../json/updatestory/"+areaName+"?pushUpdate="+pushUpdate,
            type: 'POST',
            dataType: 'json',
            async: false,
            data: JSON.stringify(story),
            contentType: "application/json; charset=utf-8",
            success: function (data) {
                $("#list-container").sortable( "option", "disabled", false );
                $('button.' + storyId).button("option", "disabled", true);
            },
            error: function (request, status, error) {
                alert(error);
            }
        });
    };

    var saveTask = function(event, pushUpdate) {
        var taskId;
        if(typeof event == "number") {
            taskId = event;
        }
        else {
            taskId = event.data.taskId;
        }
        displayUpdateMsg();
        //Creates a new task and sets all updated values
        var task = new Object();
        task.id = taskId;
        task.title = $("textarea#taskTitle"+taskId).val();
        task.owner = $("textarea#taskOwner"+taskId).val();
        task.calculatedTime = $("select#calculatedTime"+taskId).val();

        task.taskAttr1Id = $('#taskAttr1' + taskId).val();

        $.ajax({
            url: "../json/updatetask/"+areaName+"?pushUpdate="+pushUpdate,
            type: 'POST',
            async: false,
            dataType: 'json',
            data: JSON.stringify(task),
            contentType: "application/json; charset=utf-8",
            success: function (data) {
                $('button.'+taskId).button("option", "disabled", true);
                $("#list-container").sortable( "option", "disabled", false );
            },
            error: function (request, status, error) {
                alert(error);
            }
        });
    };

    var editTask = function(event) {
        var taskId = null;
        if(typeof event == "number") {
            taskId = event;
        }
        else {
            taskId = $(this).closest('li').attr('id');
        }
        var task = getChild(taskId);
        if(isGoingIntoEdit(taskId)) {
            //Because the height is fixed when the list is generated(to fix the slidetoggle-bug)
            $('#'+taskId).css("height", "auto");

            editingItems.push({id:taskId, type:"task"});
            removeGroupMember();
            $('button.'+taskId).button();
            $('button.'+taskId).unbind();
            $('.cancelButton.'+taskId).click({id: taskId},cancel);
            $("."+taskId).toggleClass('hidden-edit');
            //sets values for all edit fields
            $("textarea#taskTitle" + taskId).val(task.title);
            $("textarea#taskDescription" + taskId).val(task.description);
            $("select#calculatedTime" + taskId).val(task.calculatedTime);

            if (task.taskAttr1 != null) {
                $("select#taskAttr1" + taskId).val(task.taskAttr1.id);
            }

            //auto resize the textareas to fit the text
            $('textarea'+"."+taskId).autosize('');
        } else {
            editingItems.remove({id:taskId});
            $("."+taskId).toggleClass('hidden-edit');
            if(editingItems.length == 0) {
                $('.saveButton').button( "option", "disabled", true );
                addGroupMember();
                reload();
            }
            //Slide toggle fix
            $('#'+taskId).css("height", $('#'+taskId).height());
        }
    };

    var saveEpic = function(event, pushUpdate) {
        var epicId;
        if(typeof event == "number") {
            epicId = event;
        }
        else {
            epicId = event.data.epicId;
        }
        displayUpdateMsg();
        //Creates a new epic and sets all updated values
        var epic = new Object();
        epic.id = eval(epicId);
        epic.title = $("textarea#epicTitle"+epicId).val();
        epic.description = $("textarea#epicDescription"+epicId).val();
        epic.themeTitle = $("textarea#epicTheme"+epicId).val();
        epic.archived = $('#archiveEpic' + epicId).is(':checked');

        $.ajax({
            url: "../json/updateepic/"+areaName+"?pushUpdate="+pushUpdate,
            type: 'POST',
            async: false,
            dataType: 'json',
            data: JSON.stringify(epic),
            contentType: "application/json; charset=utf-8",
            success: function (data) {
                $('button.'+epicId).button("option", "disabled", true);
                $("#list-container").sortable( "option", "disabled", false );
            },
            error: function (request, status, error) {
                alert(error);
            }
        });
    };

    var editEpic = function(event) {
        var epicId = null;
        if(typeof event == "number") {
            epicId = event;
        }
        else {
            epicId = $(this).closest('li').attr('id');
        }
        if (view == "epic-story") {
            var epic = getParent(epicId);
        } else {
            epic = getChild(epicId);
        }

        if(isGoingIntoEdit(epicId)) {
            //Because the height is fixed when the list is generated(to fix the slidetoggle-bug)
            $('#'+epicId).css("height", "auto");

            editingItems.push({id:epicId, type:"epic"});
            removeGroupMember();

            $('button.'+epicId).button();
            $('button.'+epicId).unbind();
            $('.cancelButton.'+epicId).click({id: epicId},cancel);
            $("."+epicId).toggleClass('hidden-edit');

            $("textarea#epicTheme"+epicId).autocomplete({
                minLength: 0,
                source: "../json/autocompletethemes/" + areaName,
                select: function (event, data) {
                    $('.saveButton').button( "option", "disabled", false );
                    //Used for deselecting the input field.
                    $(this).autocomplete('disable');
                    $(this).autocomplete('enable');
                }
            });

            $("textarea#epicTheme"+epicId).focus(function() {
                $("textarea#epicTheme"+epicId).autocomplete("search", $("textarea#epicTheme"+epicId).val());
            });

            //auto resize the textareas to fit the text
            $('textarea'+"."+epicId).autosize('');
        } else {
            editingItems.remove({id:epicId});
            $("."+epicId).toggleClass('hidden-edit');
            if(editingItems.length == 0) {
                $('.saveButton').button( "option", "disabled", true );
                addGroupMember();
                reload();
            }
            //Slide toggle fix
            $('#'+epicId).css("height", $('#'+epicId).height());
        }
    };

    var saveTheme = function(event, pushUpdate) {
        var themeId;
        if(typeof event == "number") {
            themeId = event;
        }
        else {
            themeId = event.data.themeId;
        }
        displayUpdateMsg();
        //Creates a new epic and sets all updated values
        var theme = new Object();
        theme.id = eval(themeId);
        theme.title = $("textarea#themeTitle"+themeId).val();
        theme.description = $("textarea#themeDescription"+themeId).val();
        theme.archived = $('#archiveTheme' + themeId).is(':checked');

        $.ajax({
            url: "../json/updatetheme/"+areaName+"?pushUpdate="+pushUpdate,
            type: 'POST',
            async: false,
            dataType: 'json',
            data: JSON.stringify(theme),
            contentType: "application/json; charset=utf-8",
            success: function (data) {
                $('button.'+themeId).button("option", "disabled", true);
                $("#list-container").sortable( "option", "disabled", false );
            },
            error: function (request, status, error) {
                alert(error);
            }
        });
    };

    var editTheme = function(event) {
        var themeId = null;
        if (typeof event == "number") {
            themeId = event;
        } else {
            themeId = $(this).closest('li').attr('id');
        }
        if (view == "theme-epic") {
            var theme = getParent(themeId);
        } else {
            theme = getChild(themeId);
        }
        if(isGoingIntoEdit(themeId)) {

            editingItems.push({id:themeId, type:"theme"});
            removeGroupMember();

            $('button.'+themeId).button();
            $('button.'+themeId).unbind();
            $('.cancelButton.'+themeId).click({id: themeId},cancel);
            $("."+themeId).toggleClass('hidden-edit');

            //auto resize the textareas to fit the text
            $('textarea'+"."+themeId).autosize('');
        } else {
            editingItems.remove({id:themeId});
            $("."+themeId).toggleClass('hidden-edit');
            if (editingItems.length == 0) {
                $('.saveButton').button( "option", "disabled", true );
                addGroupMember();
                reload();
            }
        }
    };
    /**
     * Prints the topic for archived parent's when the lists is generated.
     */
    var getArchivedTopic = function(archived) {
        if(archived) {
            return '<p class="title ' + currentParent.id + '">Archived</p>';
        } else return '';
    };

    /**
     * A list that is appended to the site is being generated.
     * @param boolean archived true if list with archived parents is generated
     * @return string newContainer a string that holds the list
     */
    var generateList = function(archived) {
        newContainer = '';
        for (var k = 0; k < parents.length; ++k) {
            if(parents[k].archived == archived) {
                currentParent = parents[k];
                var belongingChildren = ' ';

                var oneVisible = false;
                //Add all task ids of the same story to a string
                //and check if at least one is visible
                for (var i = 0; i < currentParent.children.length; ++i) {
                    belongingChildren += currentParent.children[i].id + ' ';
                    if (visible[currentParent.children[i].id] == true) {
                        oneVisible = true;
                    }
                }
                //Sets all children of same group as visible if at least one was visible
                if (oneVisible == true) {
                    for (var i = 0; i < currentParent.children.length; ++i) {
                        visible[currentParent.children[i].id] = true;
                    }
                }

                var icon = '';

                var belongingChildrenArray = belongingChildren.trim().split(' ');

                if (belongingChildrenArray[0] != "") {
                    if (visible[belongingChildrenArray[0]] == true) {
                        icon = 'expand-icon ui-icon ui-icon-triangle-1-s';
                    } else {
                        icon = 'expand-icon ui-icon ui-icon-triangle-1-e';
                    }
                }
                if (view == "story-task") {
                    var list = '<div id="icons">'
                        +'<div title="Show tasks" class="icon ' + icon + '">'
                        +'</div>'
                        +'<a id="' + currentParent.id + '" title="Create new task" class="icon createTask add-child-icon"></a><br>'
                        +'<a id="' + currentParent.id + '" title="Clone this story excluding tasks" class="cloneItem story"><img src="../resources/image/page_white_copy.png"></a>'
                        +'<a id="' + currentParent.id + '" title="Clone this story including tasks" class="cloneItem-with-children story"><img src="../resources/image/page_white_stack.png"></a>'
                        +'</div>'
                        //TITLE FIELDS
                        +'<div id="titleDiv">'
                        //TYPE MARK START
                        +'<p class="typeMark">Story</p>'
                        //TYPE MARK END
                        //THEME START
                        +'<p class="theme ' + currentParent.id + '">' + replaceNullWithEmpty(currentParent.themeTitle) + '</p>'
                        +'<textarea placeholder="Theme" id="theme'+currentParent.id+'" class="bindChange theme hidden-edit ' + currentParent.id + '" rows="1"maxlength="100">' + replaceNullWithEmpty(currentParent.themeTitle) + '</textarea>'
                        //THEME END
                        //EPIC START
                        +'<p class="epic ' + currentParent.id + '">' + replaceNullWithEmpty(currentParent.epicTitle) + '</p>'
                        +'<textarea placeholder="Epic" id="epic'+currentParent.id+'" class="bindChange epic hidden-edit ' + currentParent.id + '" rows="1" maxlength="100">' + replaceNullWithEmpty(currentParent.epicTitle) + '</textarea>'
                        //EPIC END
                        +'<br style="clear:both" />'
                        //STORY TITLE START
                        +'<p class="titleText ' + currentParent.id + '">' + currentParent.title + '</p>'
                        +'<textarea placeholder="Title" id="title'+currentParent.id+'" class="bindChange titleText hidden-edit title ' + currentParent.id + '" rows="1" maxlength="100">' + currentParent.title + '</textarea>'
                        //STORY TITLE END
                        //STORYDESCRIPTION START
                        +'<p class="description ' + currentParent.id + '">' + addLinksAndLineBreaks(truncate(currentParent.description, 190)) + '</p>'
                        +'<textarea placeholder="Description" id="description'+currentParent.id+'" class="bindChange hidden-edit description ' + currentParent.id + '" rows="2" maxlength="1000">' + currentParent.description + '</textarea>'
                        //STORYDESCRIPTION END
                        +'</div>'
                        //TITLE FIELDS END
                        //STAKEHOLDER DIV START
                        +'<div class="stakeholders">'
                        //CUSTOMER FIELD START
                        +'<p class="title">Customer </p>'
                        +'<p class="customerSite ' + currentParent.id + '">'+getSiteImage(currentParent.customerSite)+'</p>'
                        +'<p class="' + currentParent.id + ' customer description">' + currentParent.customer + '</p>'
                        +'<select id="customerSite'+currentParent.id+'" class="bindChange customerSite hidden-edit ' + currentParent.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value="NONE"></option>'
                        +'<option value="Beijing">Beijing</option>'
                        +'<option value="Tokyo">Tokyo</option>'
                        +'<option value="Lund">Lund</option>'
                        +'</select>'
                        +'<input placeholder="Department" id="customer'+currentParent.id+'" class="bindChange customer hidden-edit ' + currentParent.id + ' text ui-widget-content ui-corner-all" maxlength="50" value="'+currentParent.customer+'"></input>'
                        //CUSTOMER FIELD END
                        //CONTRIBUTOR FIELD START
                        +'<p class="title">Contributor </p>'
                        +'<p id="'+currentParent.id+'" class="contributorSite ' + currentParent.id + '">'+getSiteImage(currentParent.contributorSite)+'</p>'
                        +'<p class="' + currentParent.id + ' contributor description">' + currentParent.contributor + '</p>'
                        +'<select id="contributorSite'+currentParent.id+'" class="bindChange contributorSite hidden-edit ' + currentParent.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value="NONE"></option>'
                        +'<option value="Beijing">Beijing</option>'
                        +'<option value="Tokyo">Tokyo</option>'
                        +'<option value="Lund">Lund</option>'
                        +'</select>'
                        +'<input placeholder="Department" id="contributor'+currentParent.id+'" class="bindChange contributor hidden-edit ' + currentParent.id + ' text ui-widget-content ui-corner-all" maxlength="50" value="'+currentParent.contributor+'"></input>'
                        //CONTRIBUTOR FIELD END
                        +'</div>'
                        //STAKEHOLDER DIV END
                        //TIME FIELDS START
                        +'<div class="times">'
                        +'<p class="title">Deadline </p>'
                        +'<p class="deadline description ' + currentParent.id + '">' + getDate(currentParent.deadline) + '</p>'
                        +'<input id="deadline'+currentParent.id+'" type="text" class="bindChange deadline hidden-edit ' + currentParent.id + ' text ui-widget-content ui-corner-all">'
                        +'<p class="title">Added </p>'
                        +'<p class="added description ' + currentParent.id + '">' + getDate(currentParent.added) + '</p>'
                        +'<input id="added'+currentParent.id+'" type="text" class="bindChange added hidden-edit ' + currentParent.id + ' text ui-widget-content ui-corner-all">'
                        +'</div>'
                        //TIME FIELDS END
                        //STATUS AND PRIO DIV START
                        +'<div class="status">'
                        //ATTR1 FIELD START
                        +'<p class="title">' + area.storyAttr1.name + '</p>'
                        +'<p class="description ' + currentParent.id + '">' + getAttrImage(currentParent.storyAttr1) + getNameIfExists(currentParent.storyAttr1) + '</p>'
                        +'<select id="storyAttr1'+currentParent.id+'" class="bindChange status hidden-edit ' + currentParent.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value=""></option>'
                        + storyAttr1Options
                        +'</select>'
                        //ATTR1 FIELD END
                        //ATTR2 FIELD START
                        +'<p class="title">' + area.storyAttr2.name + '</p>'
                        +'<p class="description ' + currentParent.id + '">' + getAttrImage(currentParent.storyAttr2) + getNameIfExists(currentParent.storyAttr2) + '</p>'
                        +'<select id="storyAttr2'+currentParent.id+'" class="bindChange prio hidden-edit ' + currentParent.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value=""></option>'
                        + storyAttr2Options
                        +'</select>'
                        //ATTR2 FIELD END
                        +'</div>'
                        //ATTR1 AND ATTR2 DIV END
                        //ATTR3 FIELD START
                        +'<div class="effort">'
                        +'<p class="title">' + area.storyAttr3.name + '</p>'
                        +'<p class="description ' + currentParent.id + '">' + getAttrImage(currentParent.storyAttr3) + getNameIfExists(currentParent.storyAttr3) + '</p>'
                        +'<select id="storyAttr3' + currentParent.id +'" class="bindChange effort hidden-edit ' + currentParent.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value=""></option>'
                        + storyAttr3Options
                        +'</select>'
                        +'<input type="checkbox" class="inline bindChange hidden-edit ' + currentParent.id + '" id="archiveStory' + currentParent.id + '"' + getArchived(currentParent.archived) + '><p class="title inline hidden-edit ' + currentParent.id + '">Archive story</p></input>'
                        +'<button class="inline marginTop cancelButton hidden-edit ' + currentParent.id + '" title="Cancel">Cancel</button>'
                        + getArchivedTopic(archived)
                        +'<p class="description ' + currentParent.id + '">' + getDate(currentParent.dateArchived) + '</p>'
                        +'</div>'
                        //ATTR3 FIELD END
                        +'<a id=' + currentParent.id + ' title="Remove story" class="icon deleteItem delete-icon"></a>'
                        +'<br style="clear:both" />';

                    newContainer += '<li class="parentLi story ui-state-default editStory" id="' + currentParent.id + '" children="' + belongingChildren + '">' + list +'</li>';


                    for (var i=0; i<currentParent.children.length; ++i) {
                        var currentChild = currentParent.children[i];

                        newContainer += '<li class="childLi task ui-state-default editTask" parentId="' + currentChild.parentId + '"' + 'id="' + currentChild.id + '">'
                        //TASKTITLE START
                        //TYPE MARK START
                        +'<p class="marginLeft typeMark">Task</p>'
                        //TYPE MARK END
                        +'<div class="taskTitle ' + currentChild.id + '">'
                        +'<p class="taskHeading">Title: </p><p class="taskInfo">'+ addLinksAndLineBreaks(truncate(currentChild.title, 190)) +'</p>'
                        +'</div>'
                        +'<textarea id="taskTitle' + currentChild.id + '" class="taskInfo bindChange taskTitle hidden-edit ' + currentChild.id + '" maxlength="500">' + currentChild.title + '</textarea>'
                        //TASKTITLE END
                        //TASKOWNER START
                        +'<div class="taskOwner ' + currentChild.id + '" id="taskOwner' + currentChild.id + '"><p class="taskHeading">Owner: </p><p class="taskInfo">'+ currentChild.owner +'</p></div>'
                        +'<textarea id="taskOwner' + currentChild.id + '" class="taskInfo bindChange taskOwner hidden-edit ' + currentChild.id + '" maxlength="50">' + currentChild.owner + '</textarea>'
                        //TASKOWNER END
                        //STATUS FIELD START
                        +'<div class="taskStatus ' + currentChild.id + '" id="taskTitle' + currentChild.id + '"><p class="taskHeading">' + area.taskAttr1.name + ': </p><p class="taskInfo ' + currentChild.id + '">' + getAttrImage(currentChild.taskAttr1) + getNameIfExists(currentChild.taskAttr1) + '</p></div>'
                        +'<select id="taskAttr1' + currentChild.id + '" class="bindChange taskInfo taskStatus hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value=""></option>'
                        + taskAttr1Options
                        +'</select>'
                        //STATUS FIELD END
                        //CALULATEDTIME START
                        +'<div class="calculatedTime ' + currentChild.id + '" id="calculatedTime' + currentChild.id + '"><p class="taskHeading">Estimated time: </p><p class="taskInfo">'+ currentChild.calculatedTime +'</p></div>'
                        +'<select id="calculatedTime' + currentChild.id + '" class="taskInfo bindChange calculatedTime hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value="0.5">0.5</option>'
                        +'<option value="1">1</option>'
                        +'<option value="1.5">1.5</option>'
                        +'<option value="2">2</option>'
                        +'</select>'
                        //CALCULATEDTIME END
                        +'<button class="cancelButton hidden-edit ' + currentChild.id + '" title="Cancel">Cancel</button>'
                        +'<a id=' + currentChild.id + ' title="Remove task" class="icon deleteItem delete-icon"></a>'
                        +'<br style="clear:both" />'
                        +'</li>';
                    }
                } else if (view == "epic-story") {
                    var list = '<div id="icons">'
                        +'<div title="Show tasks" class="icon ' + icon + '">'
                        +'</div>'
                        +'<a id="' + currentParent.id + '" title="Create new story" class="icon createStory add-child-icon"></a>'
                        +'<a id="' + currentParent.id + '" title="Clone this epic excluding children" class="cloneItem epic"><img src="../resources/image/page_white_copy.png"></a>'
                        +'</div>'
                        //TITLE FIELDS
                        +'<div id="titleDivThemeEpic">'
                        //TYPE MARK START
                        +'<p class="typeMark">Epic</p>'
                        //TYPE MARK END
                        //THEME START
                        +'<p class="theme ' + currentParent.id + '">' + replaceNullWithEmpty(currentParent.themeTitle) + '</p>'
                        +'<textarea placeholder="Theme" id="epicTheme'+currentParent.id+'" class="bindChange theme hidden-edit ' + currentParent.id + '" rows="1" maxlength="100">' + replaceNullWithEmpty(currentParent.themeTitle) + '</textarea>'
                        //THEME END
                        +'<br style="clear:both" />'
                        //EPIC TITLE START
                        +'<p class="titleText ' + currentParent.id + '">' + currentParent.title + '</p>'
                        +'<textarea placeholder="Title" id="epicTitle'+currentParent.id+'" class="bindChange titleText hidden-edit title ' + currentParent.id + '" rows="1" maxlength="100">' + currentParent.title + '</textarea>'
                        //EPIC TITLE END
                        //EPIC DESCRIPTION START
                        +'<p class="description ' + currentParent.id + '">' + addLinksAndLineBreaks(truncate(currentParent.description, 190)) + '</p>'
                        +'<textarea placeholder="Description" id="epicDescription'+currentParent.id+'" class="bindChange hidden-edit description ' + currentParent.id + '" rows="2" maxlength="1000">' + currentParent.description + '</textarea>'
                        //EPIC DESCRIPTION END
                        +'</div>'
                        //TITLE FIELDS END
                        +'<a id=' + currentParent.id + ' title="Remove epic" class="icon deleteItem delete-icon"></a>'
                        +'<input type="checkbox" class="marginTopBig inline bindChange hidden-edit ' + currentParent.id + '" id="archiveEpic' + currentParent.id + '"' + getArchived(currentParent.archived) + '><p class="title inline hidden-edit ' + currentParent.id + '">Archive epic</p></input><br>'
                        +'<button class="cancelButton hidden-edit ' + currentParent.id + '" title="Cancel">Cancel</button>'
                        + getArchivedTopic(archived)
                        +'<p class="description ' + currentParent.id + '">' + getDate(currentParent.dateArchived) + '</p>'
                        +'</div>'
                        +'<br style="clear:both" />';

                    newContainer += '<li class="parentLi epic ui-state-default editEpic" id="' + currentParent.id + '" children="' + belongingChildren + '">' + list +'</li>';


                    for (var i=0; i<currentParent.children.length; ++i) {
                        var currentChild = currentParent.children[i];
                        newContainer += '<li class="childLi story ui-state-default editStory" parentId="' + currentChild.parentId + '"' + 'id="' + currentChild.id + '">'
                        +'<div id="icons">'
                        +'<a id="' + currentChild.id + '" title="Clone this story excluding tasks" class="cloneItem story"><img src="../resources/image/page_white_copy.png"></a>'
                        +'</div>'
                        //TITLE FIELDS
                        +'<div id="titleDivEpicStory" class="padding-left">'
                        //TYPE MARK START
                        +'<p class="typeMark">Story</p>'
                        //TYPE MARK END
                        //THEME START
                        +'<p class="theme ' + currentChild.id + '">' + replaceNullWithEmpty(currentChild.themeTitle) + '</p>'
                        +'<textarea placeholder="Theme" id="theme'+currentChild.id+'" class="bindChange theme hidden-edit ' + currentChild.id + '" rows="1"maxlength="100">' + replaceNullWithEmpty(currentChild.themeTitle) + '</textarea>'
                        //THEME END
                        //EPIC START
                        +'<p class="epic ' + currentChild.id + '">' + replaceNullWithEmpty(currentChild.epicTitle) + '</p>'
                        +'<textarea placeholder="Epic" id="epic'+currentChild.id+'" class="bindChange epic hidden-edit ' + currentChild.id + '" rows="1" maxlength="100">' + replaceNullWithEmpty(currentChild.epicTitle) + '</textarea>'
                        //EPIC END
                        +'<br style="clear:both" />'
                        //STORY TITLE START
                        +'<p class="titleText ' + currentChild.id + '">' + currentChild.title + '</p>'
                        +'<textarea placeholder="Title" id="title'+currentChild.id+'" class="bindChange titleText hidden-edit title ' + currentChild.id + '" rows="1" maxlength="100">' + currentChild.title + '</textarea>'
                        //STORY TITLE END
                        //STORYDESCRIPTION START
                        +'<p class="description ' + currentChild.id + '">' + addLinksAndLineBreaks(truncate(currentChild.description, 190)) + '</p>'
                        +'<textarea placeholder="Description" id="description'+currentChild.id+'" class="bindChange hidden-edit description ' + currentChild.id + '" rows="2" maxlength="1000">' + currentChild.description + '</textarea>'
                        //STORYDESCRIPTION END
                        +'</div>'
                        //TITLE FIELDS END
                        //STAKEHOLDER DIV START
                        +'<div class="stakeholders">'
                        //CUSTOMER FIELD START
                        +'<p class="title">Customer </p>'
                        +'<p class="customerSite ' + currentChild.id + '">'+getSiteImage(currentChild.customerSite)+'</p>'
                        +'<p class="' + currentChild.id + ' customer description">' + currentChild.customer + '</p>'
                        +'<select id="customerSite'+currentChild.id+'" class="bindChange customerSite hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value="NONE"></option>'
                        +'<option value="Beijing">Beijing</option>'
                        +'<option value="Tokyo">Tokyo</option>'
                        +'<option value="Lund">Lund</option>'
                        +'</select>'
                        +'<input placeholder="Department" id="customer'+currentChild.id+'" class="bindChange customer hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all" maxlength="50" value="'+currentChild.customer+'"></input>'
                        //CUSTOMER FIELD END
                        //CONTRIBUTOR FIELD START
                        +'<p class="title">Contributor </p>'
                        +'<p id="'+currentChild.id+'" class="contributorSite ' + currentChild.id + '">'+getSiteImage(currentChild.contributorSite)+'</p>'
                        +'<p class="' + currentChild.id + ' contributor description">' + currentChild.contributor + '</p>'
                        +'<select id="contributorSite'+currentChild.id+'" class="bindChange contributorSite hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value="NONE"></option>'
                        +'<option value="Beijing">Beijing</option>'
                        +'<option value="Tokyo">Tokyo</option>'
                        +'<option value="Lund">Lund</option>'
                        +'</select>'
                        +'<input placeholder="Department" id="contributor'+currentChild.id+'" class="bindChange contributor hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all" maxlength="50" value="'+currentChild.contributor+'"></input>'
                        //CONTRIBUTOR FIELD END
                        +'</div>'
                        //STAKEHOLDER DIV END
                        //TIME FIELDS START
                        +'<div class="times">'
                        +'<p class="title">Deadline </p>'
                        +'<p class="deadline description ' + currentChild.id + '">' + getDate(currentChild.deadline) + '</p>'
                        +'<input id="deadline'+currentChild.id+'" type="text" class="bindChange deadline hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all">'
                        +'<p class="title">Added </p>'
                        +'<p class="added description ' + currentChild.id + '">' + getDate(currentChild.added) + '</p>'
                        +'<input id="added'+currentChild.id+'" type="text" class="bindChange added hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all">'
                        +'</div>'
                        //TIME FIELDS END
                        //STATUS AND PRIO DIV START
                        +'<div class="status">'
                        //ATTR1 FIELD START
                        +'<p class="title">' + area.storyAttr1.name + '</p>'
                        +'<p class="description ' + currentChild.id + '">' + getAttrImage(currentChild.storyAttr1) + getNameIfExists(currentChild.storyAttr1) + '</p>'
                        +'<select id="storyAttr1'+currentChild.id+'" class="bindChange status hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value=""></option>'
                        + storyAttr1Options
                        +'</select>'
                        //ATTR1 FIELD END
                        //ATTR2 FIELD START
                        +'<p class="title">' + area.storyAttr2.name + '</p>'
                        +'<p class="description ' + currentChild.id + '">' + getAttrImage(currentChild.storyAttr2) + getNameIfExists(currentChild.storyAttr2) + '</p>'
                        +'<select id="storyAttr2'+currentChild.id+'" class="bindChange prio hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value=""></option>'
                        + storyAttr2Options
                        +'</select>'
                        //ATTR2 FIELD END
                        +'</div>'
                        //ATTR1 AND ATTR2 DIV END
                        //ATTR3 FIELD START
                        +'<div class="effort">'
                        +'<p class="title">' + area.storyAttr3.name + '</p>'
                        +'<p class="description ' + currentChild.id + '">' + getAttrImage(currentChild.storyAttr3) + getNameIfExists(currentChild.storyAttr3) + '</p>'
                        +'<select id="storyAttr3' + currentChild.id +'" class="bindChange effort hidden-edit ' + currentChild.id + ' text ui-widget-content ui-corner-all">'
                        +'<option value=""></option>'
                        + storyAttr3Options
                        +'</select>'
                        +'<input type="checkbox" class="inline bindChange hidden-edit ' + currentChild.id + '" id="archiveStory' + currentChild.id + '"' + getArchived(currentChild.archived) + '><p class="title inline hidden-edit ' + currentChild.id + '">Archive story</p></input>'
                        +'<button class="inline marginTop cancelButton hidden-edit ' + currentChild.id + '" title="Cancel">Cancel</button>'
                        + getArchivedTopic(currentChild.archived)
                        +'<p class="description ' + currentChild.id + '">' + getDate(currentChild.dateArchived) + '</p>'
                        +'</div>'
                        //ATTR3 FIELD END
                        +'<a id=' + currentChild.id + ' title="Remove story" class="icon deleteItem delete-icon"></a>'
                        +'<br style="clear:both" />';
                        +'</li>';
                    }
                } else if (view == "theme-epic") {
                    var list = '<div id="icons">'
                        +'<div title="Show tasks" class="icon ' + icon + '">'
                        +'</div>'
                        +'<a id="' + currentParent.id + '" title="Create new epic" class="icon createEpic add-child-icon"></a><br>'
                        +'<a id="' + currentParent.id + '" title="Clone this theme excluding children" class="cloneItem theme icon"><img src="../resources/image/page_white_copy.png"></a>'
                        +'</div>'
                        //TITLE FIELDS
                        +'<div id="titleDivThemeEpic">'
                        //TYPE MARK START
                        +'<p class="typeMark">Theme</p>'
                        //TYPE MARK END
                        +'<br style="clear:both" />'
                        //TITLE START
                        +'<p class="titleText ' + currentParent.id + '">' + currentParent.title + '</p>'
                        +'<textarea placeholder="Title" id="themeTitle'+currentParent.id+'" class="bindChange titleText hidden-edit title ' + currentParent.id + '" rows="1" maxlength="100">' + currentParent.title + '</textarea>'
                        //TITLE END
                        //DESCRIPTION START
                        +'<p class="description ' + currentParent.id + '">' + addLinksAndLineBreaks(truncate(currentParent.description, 190)) + '</p>'
                        +'<textarea placeholder="Description" id="themeDescription'+currentParent.id+'" class="bindChange hidden-edit description ' + currentParent.id + '" rows="2" maxlength="1000">' + currentParent.description + '</textarea>'
                        //DESCRIPTION END
                        +'</div>'
                        //TITLE FIELDS END
                        +'<a id=' + currentParent.id + ' title="Remove theme" class="icon deleteItem delete-icon"></a>'
                        +'<input type="checkbox" class="marginTopBig inline bindChange hidden-edit ' + currentParent.id + '" id="archiveTheme' + currentParent.id + '"' + getArchived(currentParent.archived) + '><p class="title inline hidden-edit ' + currentParent.id + '">Archive theme</p></input><br>'
                        +'<button class="cancelButton hidden-edit ' + currentParent.id + '" title="Cancel">Cancel</button>'
                        + getArchivedTopic(archived)
                        +'<p class="description ' + currentParent.id + '">' + getDate(currentParent.dateArchived) + '</p>'
                        +'</div>'
                        +'<br style="clear:both" />';

                    newContainer += '<li class="parentLi theme ui-state-default editTheme" id="' + currentParent.id + '" children="' + belongingChildren + '">' + list +'</li>';


                    for (var i = 0; i<currentParent.children.length; ++i) {
                        var currentChild = currentParent.children[i];
                        newContainer += '<li class="childLi epic ui-state-default editEpic" parentId="' + currentChild.parentId + '"' + 'id="' + currentChild.id + '">'
                        +'<a id="' + currentChild.id + '" title="Clone this epic excluding children" class="cloneItem epic icon"><img src="../resources/image/page_white_copy.png"></a>'
                        //TITLE FIELDS
                        +'<div id="titleDivThemeEpic" class="padding-left">'
                        //TYPE MARK START
                        +'<p class="typeMark">Epic</p>'
                        //TYPE MARK END
                        +'<br style="clear:both" />'
                        //TITLE START
                        +'<p class="titleText ' + currentChild.id + '">' + currentChild.title + '</p>'
                        +'<textarea placeholder="Title" id="epicTitle'+currentChild.id+'" class="bindChange titleText hidden-edit title ' + currentChild.id + '" rows="1" maxlength="100">' + currentChild.title + '</textarea>'
                        //TITLE END
                        //DESCRIPTION START
                        +'<p class="description ' + currentChild.id + '">' + addLinksAndLineBreaks(truncate(currentChild.description, 190)) + '</p>'
                        +'<textarea placeholder="Description" id="epicDescription'+currentChild.id+'" class="bindChange hidden-edit description ' + currentChild.id + '" rows="2" maxlength="1000">' + currentChild.description + '</textarea>'
                        //DESCRIPTION END
                        +'</div>'
                        +'<button class="marginTopButton cancelButton hidden-edit ' + currentChild.id + '" title="Cancel">Cancel</button>'
                        +'<a id=' + currentChild.id + ' title="Remove story" class="icon deleteItem delete-icon"></a>'
                        +'<br style="clear:both" />'
                        +'</li>';
                    }
                }
            }
        }
        return newContainer;
    };

    /**
     * Builds the visible html list using the JSON data
     */
    buildVisibleList = function (archived) {
        if($("#hide-archived-list-container").attr("checked")){
            $('#archived-list-container').append(generateList(true));
            $("#archived-list-container").show();
        }
        $('#list-container').append(generateList(false));
        editingItems =  new Array();
        for (var i = 0; i < selectedItems.length; ++i) {
            $('li[id|=' + selectedItems[i].id + ']').addClass("ui-selected");
        }

        //Make sure all items that should be invisible are invisible
        //and fix bouncing bug on the li
        $(".childLi").each(function () {
            $(this).css("height", $(this).height());
            var currentId = $(this).attr("id");
            if (visible[currentId] != true) {
                $(this).addClass("ui-hidden");
            }
        });

        $('.expand-icon').click(expandClick);
        $(".parent-child-list").children("li").click(liClick);

        $(".parent-child-list").children("li").mousedown(function () {
            $(this).addClass("over");
        });

        $(".parent-child-list").children("li").mouseup(function () {
            $(".parent-child-list").children("li").removeClass("over");
        });
        $('.saveButton').button( "option", "disabled", true );

        $("a.createEpic").click(createEpic);
        $("a.createStory").click(createStory);
        $("a.createTask").click(createTask);
        $("a.deleteItem").click(deleteItem);
        $("a.cloneItem").click(function() {
            cloneItem($(this), false);
        });
        $("a.cloneItem-with-children").click(function() {
            cloneItem($(this), true);
        });
        $(".editTheme").dblclick(editTheme);
        $(".editEpic").dblclick(editEpic);
        $(".editStory").dblclick(editStory);
        $(".editTask").dblclick(editTask);

        $( "#storyTheme,#epicTheme" ).autocomplete({
            minLength: 0,
            source: "../json/autocompletethemes/" + areaName,
            change: function() {
                $( "#storyEpic" ).attr("value", "");
            },
            select: function (event, data) {
                $( "#storyEpic" ).attr("value", "");
                //Used for deselecting the input field.
                $(this).autocomplete('disable');
                $(this).autocomplete('enable');
            }
        });

        $("#storyTheme").focus(function() {
            $("#storyTheme").autocomplete("search", $("#storyTheme").val());
        });

        $("textarea#epicTheme").focus(function() {
            $("textarea#epicTheme").autocomplete("search", $("#epicTheme").val());
        });

        $( "#storyEpic" ).autocomplete({
            minLength: 0,
            select: function (event, data) {
                //Used for deselecting the input field.
                $(this).autocomplete('disable');
                $(this).autocomplete('enable');
            },
            search: function() {
                var themeName = $("#storyTheme").val();
                $( "#storyEpic" ).autocomplete({
                    source: "../json/autocompleteepics/" + areaName + "?theme=" + themeName
                });
            }
        }).focus(function() {
            $(this).autocomplete("search", "");
        }).blur(function(){
            $(this).autocomplete('enable');
        });

        //Stops textarea from making a new line when trying to save changes.
        $("textarea").keydown(function(e){
            if (e.keyCode == KEYCODE_ENTER && !e.shiftKey) {
                e.preventDefault();
            }
        });

        $(".bindChange").change( function(event){
            var id = ($(event.target)).closest('li').attr('id');
            $('.saveButton').button( "option", "disabled", false );
        });

        $(".bindChange").bind('input propertychange', function(event) {
            var id = ($(event.target)).closest('li').attr('id');
            $(".saveButton").button( "option", "disabled", false );
        });

        if(disableEditsBoolean) {
            disableEdits();
        }
    };

    var setHeightAndMargin = function (value) {
        $("header").css("height", value);
        $("#list-container-div").css("margin", value+"px auto");
    };

    $(window).resize(function() {
        $('li.childLi').css("height", "auto");
        if($(window).width() < 1280) {
            setHeightAndMargin(116);
        } else {
            setHeightAndMargin(85);
        }
    });

    if($(window).width() < 1280) {
        setHeightAndMargin(116);
    }

    /*
     * Changing the create parent button based on what view you're on
     * Also changing the view description text and the color of the view links
     */
    if (view == "story-task") {
        $("#print-stories").button().click(function() {
            printStories();
        });
        $( "#create-parent" ).button().click(function() {
            createStory();
        });
        $( "#create-parent" ).button({ label: "CREATE STORY" });
        $(".story-task-link").css("color", "#1c94c4");
        $("#topic").text("BACKLOG TOOL / ");
        $("#topic-area").text(areaName);
    } else if(view == "epic-story") {
        $("#print-stories").remove();
        $( "#create-parent" ).button().click(function() {
            createEpic();
        });
        $( "#create-parent" ).button({ label: "CREATE EPIC" });
        $(".epic-story-link").css("color", "#1c94c4");
        $("#topic").text("BACKLOG TOOL / ");
        $("#topic-area").text(areaName);
    } else if (view == "theme-epic") {
        $("#print-stories").remove();
        $( "#create-parent" ).button().click(function() {
            createTheme();
        });
        $( "#create-parent" ).button({ label: "CREATE THEME" });
        $(".theme-epic-link").css("color", "#1c94c4");
        $("#topic").text("BACKLOG TOOL / ");
        $("#topic-area").text(areaName);
    } else if (view == "home") {
        $("#print-stories").remove();
        $("create-parent").remove();
        $(".home-link").css("color", "#1c94c4");
        $("#topic-area").text("BACKLOG TOOL");
    }

    var sendMovedItems = function () {
        var moveContainer = new Object();
        var lastItem = new Object();
        moveContainer.lastItem = lastItem;

        $(".parent-child-list").children("li").each(function (index) {
            if ($(this).attr("class").indexOf("moving") != -1) {
                //Current was the grabbed item, break
                return false;
            } else if ($(this).attr("class").indexOf("ui-selected") == -1) {
                //If current not selected
                if ($(this).attr("class").indexOf("parent") != -1) {
                    moveContainer.lastItem.id = $(this).attr("id");
                    moveContainer.lastItem.type = "parent";
                    //Current was parent. If it has children that are invisible,
                    //then jump to the last one.
                    var belongingChildren = getParent($(this).attr("id")).children;
                    if (belongingChildren.length > 0) {
                        var lastChildId = belongingChildren[belongingChildren.length-1].id;
                        if (visible[lastChildId] != true) {
                            moveContainer.lastItem.id = lastChildId;
                            moveContainer.lastItem.type = "child";
                        }
                    }
                } else if ($(this).attr("class").indexOf("child") != -1
                        && visible[$(this).attr("id")] == true) {
                    moveContainer.lastItem.id = $(this).attr("id");
                    moveContainer.lastItem.type = "child";
                }
            }
        });
        moveContainer.movedItems = selectedItems;

        if (moveContainer.lastItem.id != null) {
            moveContainer.lastItem.id = eval(moveContainer.lastItem.id);
        }

        $.ajax({
            url: "../json/move" + view + "/"+areaName,
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(moveContainer),
            contentType: "application/json; charset=utf-8",
            success: function (data) {
                reload();
            },
            error: function (request, status, error) {
                alert(error);
                reload();
            }
        });
    };

    //Sets the first parent with children as fully visible on start
    if (parents.length > 0) {
        var firstParent = parents[0];
        for (var k = 0; k < firstParent.children.length; ++k) {
            visible[firstParent.children[k].id] = true;
        }
    }

    buildVisibleList();
    $("#list-container").sortable({
        tolerance: 'pointer',
        cursor: 'pointer',
        revert: false, //Animation
        placeholder: "ui-state-highlight",
        opacity: 0.50,
        axis: 'y',
        distance: 5,
        helper: function () {
            var pressed = $(".over");
            var container = $('<div/>').attr('id', 'draggingContainer');

            if (pressed.attr("class").indexOf("ui-selected") == -1) {
                liClick(pressed);
            }
            container.append($(".ui-selected").clone());

            return container;
        },
        start: function (event, ui) {
            var pressed = $(ui.item);
            pressed.addClass("moving");

            $('.ui-selected').addClass("ui-hidden");
            $("#draggingContainer").children("li").removeClass("ui-hidden");

            //Sort selected list
            var currentOrder = $('.parent-child-list').sortable('toArray');
            selectedItems.sort(function sortfunction(a, b) {
                return currentOrder.indexOf(a.id) - currentOrder.indexOf(b.id);
            });

        },
        stop: function (event, ui) {
            displayUpdateMsg();
            sendMovedItems();

            var pressed = $(ui.item);
            pressed.removeClass("moving");

            lastPressed = null;
        }

    });
    if(disableEditsBoolean) {
        $("#list-container").sortable("option", "disabled", true);
    }
    //$(".parent-child-list").not("textarea").disableSelection();

    $('.saveButton').button().click(bulkSave);
    $('#login-out').button();
    $("#expand-all").click(function() {
        for (var i=0; i<parents.length; ++i) {
            for (var j=0; j<parents[i].children.length; ++j) {
                var currentChildId = parents[i].children[j].id;
                visible[currentChildId] = true;
            }
        }
        $(".parent-child-list").empty();
        buildVisibleList();
    });
    $("#collapse-all").click(function() {
        for (var i=0; i<parents.length; ++i) {
            for (var j=0; j<parents[i].children.length; ++j) {
                var currentChildId = parents[i].children[j].id;
                visible[currentChildId] = false;
            }
        }
        $(".parent-child-list").empty();
        buildVisibleList();
    });

    var isCtrl = false;
    var isShift = false;

    $(window).keyup(function (e) {
        if (e.keyCode == KEYCODE_ENTER && !e.shiftKey) {
            bulkSave();
        }
        if (e.keyCode == KEYCODE_ESC) {
            bulkCancel();
        }
        if (e.which == KEYCODE_CTRL) {
            isCtrl = false;
        }// else if (e.which == 16) {
        //   isShift = false;
        //  }
    });

    $(window).keydown(function (e) {
        if (e.which == KEYCODE_CTRL) {
            isCtrl = true;
        } //else if (e.which == 16) {
        //   isShift = true;
        // }
    });

});
