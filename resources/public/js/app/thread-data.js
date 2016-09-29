import {requester} from 'requester'
import {kinveyConst} from 'kinvey-constants'
import {Post} from './models/post.js'


class ThreadData {
    getThread(threadName) {
        let url = `https://baas.kinvey.com/appdata/${kinveyConst.APP_ID}/${threadName}`;
        let headers = {
            'Authorization': `Kinvey ${localStorage.authKey}`,
            'ContentType': 'application/json',
        };

        return requester.get(url, {headers: headers})
    }

    addNewQuestion(data) {
        let url = `https://baas.kinvey.com/appdata/${kinveyConst.APP_ID}/${data.threadCategory}`;
        // TODO make the question class
        let newPost = {
            title: data.postTitle,
            question: data.postQuestion,
            posts: [],
            author: localStorage.username
        };
        let headers = {
            'Authorization': `Kinvey ${localStorage.authKey}`,
            'ContentType': 'application/json',
        };

        return requester.post(url, {
            headers: headers,
            data: newPost
        });
    }

    addResponse(responseContent) {
        let author = localStorage.username;
        let post = new Post(author, responseContent);
        let currentQuestionId = JSON.parse(localStorage.currentQuestionId);
        // let currentQuestionID = currentQuestion._id;
        let threadData = JSON.parse(localStorage.threadData);

        let dataToUpdate;
        for (let array of threadData.data) {
            if (array._id === currentQuestionId) {
                array.posts.push(post);
                dataToUpdate = array;
            }
        }
        let url = `https://baas.kinvey.com/appdata/${kinveyConst.APP_ID}/${threadData.categoryName}/${currentQuestionId}`;
        let headers = {
            'Authorization': `Kinvey ${localStorage.authKey}`,
            'ContentType': 'application/json',
        };

        return requester.put(url, {
            headers: headers,
            data: dataToUpdate
        });

    }

    getQuestionById(id, categoryName) {
        let url = `https://baas.kinvey.com/appdata/${kinveyConst.APP_ID}/${categoryName}/${id}`;
        let headers = {
            'Authorization': `Kinvey ${localStorage.authKey}`,
            'ContentType': 'application/json',
        };

        return requester.get(url, {headers: headers})
    }

    rateCommentUp() {

    }

    rateCommentDown() {

    }
}

const threadData = new ThreadData();

export {threadData}