# Fast API backend Design

## Base ENDPOINTS

* trigger ( I dont know if this is an api end point or something - but we need smth that does this)
* email categories counter

### Trigger Endpoint

  1. Gets the trigger that an email has been recieved
  2. Goes throught the classification model
  3. ROUTING
      1. if junk
        * mark as junk
        * push to DB - classification
      2. if FYI
        * mark as FYI
        * push to DB - classification
      3. if important
        * start processing
        * fetch older emails regarding the same thread same person
        * classify if needed to add as context or not
        * add specific context
        * prepare a draft
        * stores the draft to the DB
        * wait for the human to approve or reject

### Email categories counter

  1. for each category gets the unvisited numbers from mongo db

### Category based Email information fetcher 
  1. when the user clicks on the category [Important (12) | FYI (30) | JUNK (20)]
  2. if he clicks on the Important, the important category page should open with all the necessary information,that is what this api is for 
  3. classification = [IMP] | visited = [false]

## Important Emails Page 
So this page will have the list of important un reviewed emails where we hadn't taken any actions. 
### Approve and Send | Send 
  1. This means the reply is awesome and the user wants to send the email 
  2. So basically send reply using the gmail handler 
  3. Update the visted status in the DB
### Edit and Send 
  1. Very minor improvements the user wants to do so we just let the user edit the test on the go. 
  2. Same send function [Approve and Send can be merged with this api if we just provide the response in an editable texbox.]
  3. Update the visted status in the DB
### Rewrite with insturctions
  1. For emails where extra information or realignment is needed so the user can just prompt.
  2. So the same retrigger flow works and the email is rewritten. ( A lengthy process might need some thinking to optimize)







# Schema Keys

* classification : enum [IMP | FYI |JNK]
* visted : boolean [true | false ]
* 
