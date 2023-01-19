/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createStore, applyMiddleware } from "redux";
import thunk from 'redux-thunk';
import createSagaMiddleware from 'redux-saga';
import rootReducer from '../reducers/index';
import rootSagas from '../sagas';


const saga = createSagaMiddleware();
const middlewares = [saga, thunk];

const store = createStore(rootReducer, applyMiddleware(...middlewares));

saga.run(rootSagas);

export default store;
