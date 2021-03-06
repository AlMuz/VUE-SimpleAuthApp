import Vue from 'vue'
import Vuex from 'vuex'
import axios from './axios-auth';
import globalAxios from 'axios';
import router from './router';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    idToken: null,
    userId: null,
    user: null,
  },
  mutations: {
    authUser(state, userData) {
      state.idToken = userData.token;
      state.userId = userData.userId;
    },
    storeUser(state, user) {
      state.user = user;
    },
    clearAuthData(state) {
      state.idToken = null;
      state.userId = null;
    }
  },
  actions: {
    setLogoutTimer({ dispatch }, expirationTime) {
      setTimeout(() => {
        dispatch('logout');
      }, expirationTime * 1000);
    },
    signup({ commit, dispatch }, payload) {

      axios.post('accounts:signUp?key=' + process.env.GOOGLE_API_KEY, {
        email: payload.email,
        password: payload.password,
        returnSecureToken: true
      })
        .then(res => {
          commit('authUser', {
            token: res.data.idToken,
            userId: res.data.localId
          });

          const now = new Date();
          const expirationDate = new Date(now.getTime() + res.data.expiresIn * 1000);
          localStorage.setItem('token', res.data.idToken);
          localStorage.setItem('userId', res.data.localId);
          localStorage.setItem('expirationDate', expirationDate);

          dispatch('storeUser', payload);
          dispatch('setLogoutTimer', res.data.expiresIn);
          router.replace('/dashboard');
        })
        .catch(error => {
          if (error.response.data) {
            alert('Error: ' + error.response.data.error.message);
          }else {
            alert('Connection error');
          }
        });
    },
    signin({ commit, dispatch }, payload) {

      axios.post('accounts:signInWithPassword?key=' + process.env.GOOGLE_API_KEY, {
        email: payload.email,
        password: payload.password,
        returnSecureToken: true
      })
        .then(res => {
          commit('authUser', {
            token: res.data.idToken,
            userId: res.data.localId
          });

          const now = new Date();
          const expirationDate = new Date(now.getTime() + res.data.expiresIn * 1000);
          localStorage.setItem('token', res.data.idToken);
          localStorage.setItem('userId', res.data.localId);
          localStorage.setItem('expirationDate', expirationDate);
          dispatch('setLogoutTimer', res.data.expiresIn);

          router.replace('/dashboard');
        })
        .catch(error => {
          if (error.response.data) {
            alert('Error: ' + error.response.data.error.message);
          }else {
            alert('Connection error');
          }
        })
    },
    tryToAutoLogin({ commit }) {

      const token = localStorage.getItem('token');
      if (!token) {
        return
      }

      const expirationDate = localStorage.getItem('expirationDate');
      const now = new Date();
      if (now <= expirationDate) {
        return
      }

      const userId = localStorage.getItem('userId');
      commit('authUser', {
        token: token,
        userId: userId
      })

    },
    logout({ commit }) {

      commit('clearAuthData');
      localStorage.removeItem('expirationDate');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      router.replace('/signin');
    },
    storeUser({ commit, state }, payload) {

      if (!state.idToken) {
        return;
      }

      globalAxios.post('/users.json' + '?auth=' + state.idToken, payload)
    },
    fetchUser({ commit, state }, payload) {
      if (!state.idToken) {
        return;
      }

      globalAxios.get('/users.json' + '?auth=' + state.idToken)
        .then(res => {
          const data = res.data
          const users = []
          for (let key in data) {
            const user = data[key]
            user.id = key
            users.push(user)
          }
          commit('storeUser', users[0])
        })
        .catch(error => console.log(error))
    }
  },
  getters: {
    user(state) {
      return state.user;
    },
    isAuth(state) {
      return state.idToken !== null;
    }
  }
})
