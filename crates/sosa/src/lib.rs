use std::collections::{HashMap, VecDeque};

use anyhow::Result;
use genealogy_types::PersonId;

/// Calcule la numérotation Sosa-Stradonitz pour un arbre donné.
pub fn compute_sosa(root: PersonId, parents: impl Fn(PersonId) -> Result<Vec<PersonId>>) -> Result<HashMap<PersonId, u64>> {
    let mut numbering = HashMap::new();
    numbering.insert(root, 1);

    let mut queue = VecDeque::new();
    queue.push_back(root);

    while let Some(current) = queue.pop_front() {
        let current_number = numbering[&current];
        let parent_list = parents(current)?;

        if let Some(&father) = parent_list.first() {
            numbering.insert(father, current_number * 2);
            queue.push_back(father);
        }

        if let Some(&mother) = parent_list.get(1) {
            numbering.insert(mother, current_number * 2 + 1);
            queue.push_back(mother);
        }
    }

    Ok(numbering)
}
