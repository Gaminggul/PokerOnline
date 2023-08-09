
#![feature(const_for)]
#![feature(const_mut_refs)]
#![feature(const_trait_impl)]
#![feature(const_intoiterator_identity)]
#![feature(macro_metavar_expr)]

use card::Card;

mod card;
pub struct GameInstance {
    id: String,
    center_cards: Vec<Card>,
}
