import 'jquery'
import {templateGenerator} from 'template-generator'
import {notifier} from 'notifier'
import {threadData} from 'thread-data'

const mainContainer = $('#wrapper');

function rateCommentUp(questionData, categoryName) {
    $('#comments-container').on('click', '.rate-comment-up', function () {
        let $this = $(this);
        let $rating = $this.siblings('.rating').find(".rating-value");
        let currentRating = +$rating.text();

        $rating.text(`${currentRating += 1}`);

        let id = $(this)
            .parents('.comment')
            .eq(0)
            .attr('data-id');

        return threadData.rateCommentUp(id, questionData, categoryName);
    })
}

function rateCommentDown(questionData, categoryName) {
    $('#comments-container').on('click', '.rate-comment-down', function () {
        let $this = $(this);
        let $rating = $this.siblings('.rating').find(".rating-value");
        let currentRating = +$rating.text();

        $rating.text(`${currentRating -= 1}`);

        let id = $(this)
            .parents('.comment')
            .eq(0)
            .attr('data-id');

        return threadData.rateCommentDown(id, questionData, categoryName);
    })
}

class ThreadController {
    home() {
        templateGenerator.load('home', 'home')
            .then(function (htmlContent) {
                mainContainer.html(htmlContent);
            });
    }

    components() {
        templateGenerator.load('components', 'index')
            .then(function (htmlContent) {
                mainContainer.html(htmlContent);
            });
    }

    showThread(threadName) {
        // let path = context.path;
        // let threadName = path.substr(path.indexOf('#') + 2);
        Promise.all([templateGenerator.load('thread', 'read'), threadData.getThread(threadName)])
            .then(function ([htmlTemplate,data]) {
                // in order to make the thread template generic we need to add the thread name to the data object
                let dataWithCategoryName = {
                    data: data,
                    categoryName: threadName
                };
                localStorage.setItem('threadData', JSON.stringify(dataWithCategoryName));
                mainContainer.html(htmlTemplate(dataWithCategoryName));
            })
            .catch(function () {
                notifier.error("You must be logged in in order to view the threads!")
            })
    }

    askQuestion(context) {
        templateGenerator.load('post', 'add')
            .then(function (htmlContent) {
                mainContainer.html(htmlContent);
            })
            .then(function () {
                $('#add-post-btn').on('click', function (ev) {
                    let threadCategory = $('#thread-category').val();
                    let postTitle = $('#post-title').val();
                    let postQuestion = $('#post-content').val();

                    threadData.addNewQuestion({
                        threadCategory,
                        postTitle,
                        postQuestion
                    })
                        .then(function () {
                            notifier.success('Post Added');
                            context.redirect(`#/${threadCategory}`);
                        })
                        .catch(function () {
                            notifier.error("You must be logged in to post!");
                            context.redirect('#/login');
                        });

                    ev.preventDefault();
                    return false;
                })
            })
    }

    showQuestion(context) {
        let threadContent = JSON.parse(localStorage.threadData);
        let urlId = context.params.id;
        let categoryName = threadContent.categoryName;

        let questionData = threadData.getQuestionById(urlId, categoryName);

        Promise.all([questionData, templateGenerator.load('selected-question', 'selected-question')])
            .then(function ([data,htmlContent]) {
                mainContainer.html(htmlContent(data));
            })
            .then(function () {
                rateCommentUp(questionData, categoryName);
                rateCommentDown(questionData, categoryName);
            })
            .then(function () {
                $('#btn-post-response').on('click', function () {
                    let responseContentContainer = $('#post-response-content');
                    let responseContent = responseContentContainer.val();
                    responseContentContainer.val('');

                    localStorage.setItem('currentQuestionId', JSON.stringify(urlId));
                    threadData.addResponse(responseContent)
                        .then(function () {
                            notifier.success("Post added!");
                            // context.redirect(`#/${urlId}`);
                            window.refreshState();
                        })
                        .catch(function (errorLog) {
                            notifier.error("The post wasn't added! Please try again!");
                            console.log(errorLog)
                        })
                })
            })
            .then(function () {
                $('.comment').on('click', '.btn-delete-post', function (ev) {
                    let id = $(this)
                        .parents('.comment')
                        .eq(0)
                        .attr('data-id');

                    threadData.deletePost(id, questionData, categoryName)
                        .then(function () {
                            notifier.success("The post has been deleted!");
                            // context.redirect(`#/${categoryName}`);

                            window.refreshState();
                        })
                        .catch(function (erroLog) {
                            notifier.error(erroLog);
                        });

                    ev.preventDefault();
                    return false;
                })
            })
            .catch(function (errorLog) {
                notifier.error('Error has occurred please try again!');
                console.log(errorLog);
            })
    }

	search() {
        let searchedText = $('#searchText').val();

        console.log(searchedText);
        let dataToSearchIn = JSON.parse(localStorage.threadData).data;
        let category = JSON.parse(localStorage.threadData).categoryName;
        // console.log(category);

        let searchResult = [];

        dataToSearchIn.forEach(function(element) {

            let title = element.title || "";
            let question = element.question || "";
            let author = element.author || "";

            if((title.toLowerCase().indexOf(searchedText.toLowerCase()) !== -1) ||
                    (question.toLowerCase().indexOf(searchedText.toLowerCase()) !== -1) ||
                    (author.toLowerCase().indexOf(searchedText.toLowerCase()) !== -1)){
                searchResult.push(element._id);
            } else {
                let posts = element.posts || [];

                posts.forEach(function(post) {
                    let author = post.author || "";
                    let content = post.content || "";

                    if((author.toLowerCase().indexOf(searchedText.toLowerCase()) !== -1) ||
                            (content.toLowerCase().indexOf(searchedText.toLowerCase()) !== -1)){
                        searchResult.push(element._id);
                    }
                });
            }
        });
        // console.log(searchResult);
        $("#wrapper").html("").append(`<div class="container search-results">
                                            <div class="content">
                                                <div class="card">
                                                <h4 class="big-title main uppercase"><span class="text main">Search results for query:</span> <span class="query">${searchedText}</span></h4>
                                                
                                                <hr>

                                                <div class="results-container">
                                                    
                                                </div>
                                            </div>

                                        </div>
                                    </div>`);

        searchResult.forEach(function(result){
            Promise.all([templateGenerator.load('search', 'search'), threadData.search(result, category)])
                .then(function ([htmlTemplate, data]){
                    let searchedToDisplay = {
                        data: data,
                        categoryName: category
                    }
                    $(".results-container").append($(htmlTemplate(searchedToDisplay)));
                })
                .catch(function(errorLog) {
                    notifier.error("No search result!");
                    console.log(errorLog);
                })
        })

    }

    addResponse() {

    }
}

const
    threadController = new ThreadController();

export {
    threadController
}