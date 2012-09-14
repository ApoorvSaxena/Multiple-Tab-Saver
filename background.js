$(document).ready(function() {	
	render();
	$('#tab_group_name').focus(function(){					
		if($(this).val() === 'Enter Tab Group Name')
			$(this).val('');		
	}).blur(function(){
		if($(this).val() === '')
			$(this).val('Enter Tab Group Name');
	});	
	$('#reset_storage_button').click(function(){
		reset_local_storage();
	});
	$('#current_tab_button').click(function(){
		chrome.tabs.getSelected(null, function(tab){	    
		    initialize(tab);
		});
	});
	$('#current_window_button').click(function(){		
		var tab_group_name = $('#tab_group_name').val();
		if(tab_group_name === '' || tab_group_name === 'Enter Tab Group Name'){			
			if(get_tabs()){
				var keys_length = Object.keys(get_tabs().group_tabs).length;				
				if(keys_length > 0)
					tab_group_name = 'BookMark-' + (keys_length + 1);
				else
					tab_group_name = 'BookMark-1';
			}
			else{
				tab_group_name = 'BookMark-1';
			}
		}		
		$('#tab_group_name').val(tab_group_name);
		chrome.tabs.getAllInWindow(null, function(tabs){	    						
		    initialize(tabs, tab_group_name);		    
		});
		return false;
	});
	$('#savedLinks').on('click', '.group_tab', function(){
		var group_name = $(this).attr('name'), links_array = [];
		$('ul li ul li a').each(function(){
			if($(this).attr('group') === group_name){
				links_array.push($(this).attr('href'));				
			}				
		});		
		create_tabs(links_array);				
	});
});

function create_tabs(links_array){
	chrome.tabs.create({'url':links_array.pop()}, function(){
		if(links_array.length > 0)
			create_tabs(links_array);		
	});
}

function initialize(tabs){
	if(!localStorage.tabs){
		var obj = {};		
		obj.group_tabs = obj.individual_tabs = {};
		localStorage.tabs = JSON.stringify(obj);
	}
	if(tabs.length){
		var tab_group_name = $('#tab_group_name').val();		
		for(var i=0; i<tabs.length; i++)
			if(!tabs[i]['url'].match('^(chrome).*:\/\/'))
				save_tab(tabs[i], tab_group_name);					
	}
	else{
		if(!tabs['url'].match('^(chrome).*:\/\/'))
			save_tab(tabs, '');
	}		
	render();
}

function reset_local_storage(){
	delete localStorage.tabs;
	update_link_list('');
}

function get_tabs(){	
	if(localStorage.tabs)
		return JSON.parse(localStorage.tabs);
	else
		return false;
}

function save_tab(tab, tab_group_name){
		var tabs_hash = JSON.parse(localStorage.tabs);
		if(tab_group_name === ''){			
			tabs_hash.individual_tabs[tab['url']] = tab['title'];
		}			
		else{
			if(!tabs_hash.group_tabs[tab_group_name])			
				tabs_hash.group_tabs[tab_group_name] = {};
			tabs_hash.group_tabs[tab_group_name][tab['url']] = tab['title'];
		}			
		localStorage.tabs = JSON.stringify(tabs_hash);		
}

function render(){
	var tabs = get_tabs(), tabs_list = "";			
	if(tabs){
		for(var state in tabs) {									
		    if (tabs.hasOwnProperty(state)){		    	
		    	if(state === 'individual_tabs'){
		    		for(var url in tabs[state]){		    		
		    			if (tabs[state].hasOwnProperty(url)){		    			
		    				tabs_list += "<li><a href='" + url +  "' target='newtab' class='" + state + "'>" + tabs[state][url] + "</a></li>";		    			
		    			}
		    		}	
		    	}
		    	else{
		    		for(var tabs_group_name in tabs[state]){		    		
		    			if (tabs[state].hasOwnProperty(tabs_group_name)){
		    				tabs_list += "<li><a class='group_tab' name='" + tabs_group_name + "' style='cursor:pointer;'>" + tabs_group_name + "</a><ul>";
					    	for(var url in tabs[state][tabs_group_name]){		    		
					    		if (tabs[state][tabs_group_name].hasOwnProperty(url)){		    			
					    			tabs_list += "<li><a href='" + url +  "' target='newtab' class='" + state + "' group='" + tabs_group_name + "' >" + tabs[state][tabs_group_name][url] + "</a></li>";		    			
					    		}
					    	}
					    	tabs_list += "</ul></li>";
		    			}
		    		}
		    	}		    	
		    }
		}	
		update_link_list(tabs_list);
	}	
}

function update_link_list(list){
	$('#savedLinks').html(list);
}