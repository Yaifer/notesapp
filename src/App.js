//IMPORTS=====================================================================================
//import logo from './logo.svg';
import './App.css';

import React, {useEffect, useReducer} from 'react';
import { API } from 'aws-amplify';
import { List, Input, Button, PageHeader } from 'antd';
import 'antd/dist/antd.min.css';
import { listNotes } from './graphql/queries';
import { v4 as uuid } from 'uuid';
import { createNote as CreateNote, deleteNote as DeleteNote, updateNote as UpdateNote } from './graphql/mutations'

const CLIENT_ID = uuid();

//INITIAL STATE=============================================================================
const initialState = {
  notes: [],
  loading: true,
  error: false,
  form: { name: '', description: '' }
};
//REDUCER===================================================================================
const reducer = (state, action) => {
  switch(action.type) {
    case 'SET_NOTES':
      return { ...state, notes: action.notes, loading: false };
    case 'ERROR':
      return { ...state, loading: false, error: true }

    case 'ADD_NOTE':
      return { ...state, notes: [action.note, ...state.notes]};
    case 'RESET_FORM':
      return { ...state, form: initialState.form };
    case 'SET_INPUT':
      return { ...state, form: { ...state.form, [action.name]: action.value } };

    default:
      return {...state};
  }
};
//APP CONSTANT===========================================================================
const App = () => {

  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchNotes = async() => {
    try {
      const notesData = await API.graphql({
        query: listNotes
      });
      console.log('I have the list so I am calling the API!')
      dispatch({ type: 'SET_NOTES', notes: notesData.data.listNotes.items });
    } catch (err) {
      console.error('error: ', err);
      dispatch({ type: 'ERROR' })
    }
  };

//USE EFFECT==========================================================================
  useEffect(() => {
    fetchNotes()
  }, []);

// CREATE NOTE===========================================================================
  const createNote = async () => {
    //Deconstructing
    const { form } = state;
    // Easy Validation
    if (!form.name || !form.description) {
       return alert('please enter a name and description')
    }
    const note = { ...form, client: CLIENT_ID, completed: false, id: uuid() }
    dispatch({ type: 'ADD_NOTE', note: note });
    dispatch({ type: 'RESET_FORM' });

    try {
      await API.graphql({
        query: CreateNote,
        variables: { input: note }
      });
      console.log('successfully created note!')

    } catch (err) {
      console.error("error: ", err)
    }
  };

//DELETE NOTE===========================================================================
  const deleteNote = async (noteToDelete) => {
    // Optmisticly update state and screen. 
    dispatch ({type: "SET_NOTES", notes: state.notes.filter(x => x !== noteToDelete)});

    //then do the delete via Graphql mutation.
    try {
      await API.graphql({
        query: DeleteNote,
        variables: {input: {id: noteToDelete.id }}
      });
    }
    catch (err) {
      console.error(err);
    }
  }

//UPDATE NOTE===========================================================================
const updateNote = async (noteToUpdate) => {
  // Optmisticly update state and screen. 
  dispatch ({type: "SET_NOTES", notes: state.notes.map(x => ({...x, completed: x ===  noteToUpdate ? !x.completed: x.completed})
  )});

  //then do the update via Graphql mutation.
  try {
    await API.graphql({
      query: UpdateNote,
      variables: {input: {id: noteToUpdate.id, completed: !noteToUpdate.completed }}
    });
  }
  catch (err) {
    console.error(err);
  }
}

//ON CHANGE============================================================================
  const onChange = (e) => {
    dispatch({ type: 'SET_INPUT', name: e.target.name, value: e.target.value });
  };

// RENDER ITEM===========================================================================
  const renderItem = (item) => {
    return (
      <List.Item 
        style={styles.item}
        actions={[
          <p style={styles.p} onClick={() => deleteNote(item)}>
            Delete
          </p>]}>,
          <p style={styles.p2} onClick={() => updateNote(item)}>
            {item.completed ? 'Mark incomplete' : 'Mark complete'}
          </p>
        <List.Item.Meta
          title={` ${item.name} ${item.completed ? ' (completed)' : ''}`}
          description={item.description}
        />
      </List.Item>
    );
  }; 
//RETURNS================================================================================
  return (
    <div style={styles.container}>
      <h1 style={{color: "blue", fontWeight: "bolder", fontSize:"32pt",textAlign:"center"}}>NOTES MCGOATS</h1>
      <PageHeader
        className="site-page-header"
        title="Keep your Note-Goats in a Row!!!!!!!!!!!"
        subTitle="a program from the desk of Jeffery Hannon"
      />
      <hr/>
      <Input
        onChange={onChange}
        value={state.form.name}
        placeholder="Enter a goat-note name"
        name='name'
        style={styles.input}
      />
      <Input
        onChange={onChange}
        value={state.form.description}
        placeholder="Enter a goat-note description"
        name='description'
        style={styles.input}
      />
      <Button
        onClick={createNote}
        type="primary"
      >Create a Goat-Note</Button>
      <hr/>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}

//JS STYLES===============================================================================
const styles = {
  container: {padding: 30, background:'lightgray', marginBottom: 20, borderRadius: 60 + 'px', border: '8px solid #1e8cfc', margin:'10px', fontSize: '20px'},
  input: {marginBottom: 5},
  item: { textAlign: 'left' },
  p: { color: 'red', background:'black', padding:'5px', borderRadius: 10 + 'px'},
  p2: { color: '#fff', background:'#1e8cfc', padding:'5px', borderRadius: 3 + 'px',width:'10%',textAlign:"center"}
}

export default App;
