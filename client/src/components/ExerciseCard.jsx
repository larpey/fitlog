function ExerciseCard({ exercise, onChange, onRemove }) {
  function updateName(e) {
    onChange({ ...exercise, name: e.target.value });
  }

  function updateSet(i, field, value) {
    const newSets = [];
    for (let j = 0; j < exercise.sets.length; j++) {
      if (j === i) {
        newSets.push({ ...exercise.sets[j], [field]: value === '' ? '' : Number(value) });
      } else {
        newSets.push(exercise.sets[j]);
      }
    }
    onChange({ ...exercise, sets: newSets });
  }

  function addSet() {
    // copy values from last set as default
    const last = exercise.sets[exercise.sets.length - 1];
    const newSet = {
      weight: last ? last.weight : 0,
      reps: last ? last.reps : 0
    };
    onChange({ ...exercise, sets: [...exercise.sets, newSet] });
  }

  function removeSet(i) {
    onChange({ ...exercise, sets: exercise.sets.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="exercise-card">
      <div className="exercise-header">
        <input
          className="exercise-name-input"
          type="text"
          value={exercise.name}
          onChange={updateName}
          placeholder="Exercise name"
        />
        <button className="icon-btn" onClick={onRemove} aria-label="Remove exercise">x</button>
      </div>

      <div className="set-grid-header">
        <span>SET</span>
        <span>WEIGHT</span>
        <span>REPS</span>
        <span></span>
      </div>

      {exercise.sets.map((set, i) => (
        <div key={i} className="set-row">
          <span className="set-num">{i + 1}</span>
          <input
            type="number"
            min="0"
            value={set.weight}
            onChange={(e) => updateSet(i, 'weight', e.target.value)}
          />
          <input
            type="number"
            min="0"
            value={set.reps}
            onChange={(e) => updateSet(i, 'reps', e.target.value)}
          />
          <button className="icon-btn small" onClick={() => removeSet(i)}>x</button>
        </div>
      ))}

      <button className="add-set-link" onClick={addSet}>+ add set</button>
    </div>
  );
}

export default ExerciseCard;
